import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { PlayerAnswer } from './entities/player-answer.entity';
import { GamePlayer } from '@/game-players/entities/game-player.entity';
import { Question, QuestionType } from '@/questions/entities/question.entity';
import { Answer } from '@/answers/entities/answer.entity';

@Injectable()
export class PlayerAnswersService {
    constructor(
        @InjectRepository(PlayerAnswer)
        private readonly answersRepo: Repository<PlayerAnswer>,
        @InjectRepository(GamePlayer)
        private readonly playersRepo: Repository<GamePlayer>,
        @InjectRepository(Question)
        private readonly questionsRepo: Repository<Question>,
        @InjectRepository(Answer)
        private readonly answersRepo2: Repository<Answer>,
    ) {
    }

    private readonly answerLocks = new Map<string, Promise<void>>();

    async recordTimeout(playerId: string, questionId: string) {
        return this.submitAnswer('', questionId, undefined, { timedOut: true }, 0, playerId);
    }

    async submitAnswer(socketId: string, questionId: string, answerId: string | undefined, response: Record<string, unknown> | undefined, clientTime: number, internalPlayerId?: string) {
        const participant = await this.playersRepo.findOne({ where: internalPlayerId ? { id: internalPlayerId } : { socketId } });
        if (!participant) throw new NotFoundException('Player not found');
        const previous = this.answerLocks.get(participant.id) || Promise.resolve();
        let release!: () => void;
        const ready = new Promise<void>((resolve) => { release = resolve; });
        const queued = previous.catch(() => {}).then(() => ready);
        this.answerLocks.set(participant.id, queued);
        await previous.catch(() => {});
        try { return await this.persistAnswer(socketId, questionId, answerId, response, clientTime, participant.id); }
        finally { release(); if (this.answerLocks.get(participant.id) === queued) this.answerLocks.delete(participant.id); }
    }

    private async persistAnswer(
        playerSocketId: string,
        questionId: string,
        answerId: string | undefined,
        response: Record<string, unknown> | undefined,
        _clientTimeTaken: number,
        internalPlayerId?: string,
    ) {
        // 1. Find player
        const player = await this.playersRepo.findOne({
            where: internalPlayerId ? { id: internalPlayerId } : {socketId: playerSocketId},
            relations: ['session'],
        });

        if (!player) throw new NotFoundException('Player not found');
        if (player.eliminatedAt) throw new BadRequestException('Player has been eliminated');

        // 2. Validate question
        const question = await this.questionsRepo.findOne({
            where: {id: questionId},
            relations: ['answers'],
        });

        if (!question) throw new NotFoundException('Question not found');
        if (player.session.status !== 'RUNNING' || question.quizId !== player.session.quizId) {
            throw new BadRequestException('Question is not available in this session');
        }
        const index = player.session.mode === 'PROGRESS' ? player.currentQuestionIndex : player.session.currentQuestionIndex;
        const isCurrent = player.questionOrder ? player.questionOrder[index] === questionId : question.position === index;
        if (!isCurrent) throw new BadRequestException('Question is not current');
        if(player.activeQuestionId!==questionId || !player.questionStartedAt) throw new BadRequestException('Question clock is not started');
        const elapsed=Math.max(0,Date.now()-new Date(player.questionStartedAt).getTime());
        const limit=question.timeLimit*1000;
        const timedOut=elapsed>=limit || response?.timedOut===true;
        const timeTaken=Math.min(elapsed,limit);
        if(timedOut){answerId=undefined;response={timedOut:true};}

        let selectedAnswer: Answer | null = null;
        if (answerId) {
            selectedAnswer = await this.answersRepo2.findOne({ where: { id: answerId } });
            if (!selectedAnswer) throw new NotFoundException('Answer not found');
            if (!question.answers.some((answer) => answer.id === answerId)) {
                throw new BadRequestException('Answer does not belong to this question');
            }
        }

        // 4. Prevent double answers
        const alreadyAnswered = await this.answersRepo.findOne({
            where: {
                player_id: player.id,
                question_id: questionId,
            },
        });

        if (alreadyAnswered) {
            throw new BadRequestException('Player already answered this question');
        }

        const correctness = timedOut ? 0 : this.calculateCorrectness(question, selectedAnswer, response);
        const isCorrect = correctness === 1;

        // 6. Calculate score
        let earnedPoints = 0;

        if (correctness > 0) {
            const base = question.points;
            const penalty = Math.floor(timeTaken / 100); // 100 ms = -1 point
            earnedPoints = Math.max(Math.round(base * correctness) - penalty, 0);
        }

        // 7. Save PlayerAnswer
        const playerAnswer = this.answersRepo.create({
            player,
            player_id: player.id,
            question,
            question_id: questionId,
            selectedAnswer,
            selectedAnswerId: answerId ?? null,
            response: response ?? null,
            isCorrect,
            timeTaken,
            earnedPoints,
        });

        await this.answersRepo.save(playerAnswer);

        // 8. Update total score
        player.totalScore += earnedPoints;
        await this.playersRepo.save(player);

        return {
            sessionId: player.session_id,
            playerId: player.id,
            correct: isCorrect,
            timedOut,
            earnedPoints,
            totalScore: player.totalScore,
            correctness,
            explanation: question.explanation || null,
        };
    }

    private calculateCorrectness(
        question: Question,
        selectedAnswer: Answer | null,
        response?: Record<string, unknown>,
    ): number {
        if (question.type === QuestionType.MULTIPLE_CHOICE || question.type === QuestionType.TRUE_FALSE) {
            return selectedAnswer?.isCorrect ? 1 : 0;
        }

        if (question.type === QuestionType.MULTIPLE_RESPONSE) {
            const selectedIds = Array.isArray(response?.answerIds) ? [...new Set(response.answerIds.map(String))] : [];
            const correctIds = question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.id);
            const correctSelected = selectedIds.filter((id) => correctIds.includes(id)).length;
            const incorrectSelected = selectedIds.filter((id) => !correctIds.includes(id)).length;
            return correctIds.length ? Math.min(1, Math.max(0, (correctSelected - incorrectSelected) / correctIds.length)) : 0;
        }

        if (question.type === QuestionType.FILL_BLANK) {
            const submitted = Array.isArray(response?.order) ? response.order : [];
            const expected = [...(question.configuration?.items ?? [])]
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map((item) => item.id);
            return expected.length ? submitted.filter((id, index) => id === expected[index]).length / expected.length : 0;
        }

        if (question.type === QuestionType.OPEN_TEXT) {
            const submitted = typeof response?.text === 'string' ? response.text : '';
            const normalize = (value: string) => question.configuration?.caseSensitive
                ? value.trim()
                : value.trim().toLocaleLowerCase();
            return question.answers.some((answer) => answer.isCorrect && normalize(answer.text) === normalize(submitted)) ? 1 : 0;
        }

        if (question.type === QuestionType.MATCHING) {
            const submitted = Array.isArray(response?.matches) ? response.matches : [];
            const expected = question.configuration?.pairs ?? [];
            return expected.length ? expected.filter((pair) =>
                submitted.some((match) => {
                    if (!match || typeof match !== 'object') return false;
                    const value = match as Record<string, unknown>;
                    return value.leftId === pair.leftId && value.rightId === pair.rightId;
                }),
            ).length / expected.length : 0;
        }

        if (question.type === QuestionType.ORDERING || question.type === QuestionType.FILL_BLANK) {
            const submitted = Array.isArray(response?.order) ? response.order : [];
            const expected = [...(question.configuration?.items ?? [])]
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map((item) => item.id);
            return expected.length ? submitted.filter((id, index) => id === expected[index]).length / expected.length : 0;
        }
        return 0;
    }

    async getQuestionStats(sessionId: string, questionId: string) {
        const question = await this.questionsRepo.findOne({
            where: { id: questionId },
            relations: ["answers"],
        });

        if (!question) {
            throw new NotFoundException("Question not found");
        }

        const answers = await this.answersRepo.find({
            where: {
                question_id: questionId,
                player: { session_id: sessionId },
            },
            relations: ["player", "selectedAnswer"],
        });

        const totalAnswers = answers.length;

        const countMap: Record<string, number> = {};

        answers.forEach(a => {
            const id = a.selectedAnswerId ?? "none";
            countMap[id] = (countMap[id] || 0) + 1;
        });

        const resultAnswers = [QuestionType.MULTIPLE_CHOICE, QuestionType.TRUE_FALSE].includes(question.type)
            ? question.answers.map(answer => ({
            id: answer.id,
            text: answer.text,
            isCorrect: answer.isCorrect,
            count: countMap[answer.id] || 0,
        }))
            : [];

        return {
            questionId,
            questionType: question.type,
            totalAnswers,
            correctAnswers: answers.filter((answer) => answer.isCorrect).length,
            accuracy: totalAnswers ? answers.filter((answer) => answer.isCorrect).length / totalAnswers : 0,
            answers: resultAnswers,
            playerBreakdown: answers.map((answer) => ({
                playerId: answer.player.id,
                nickname: answer.player.nickname,
                correct: answer.isCorrect,
                earnedPoints: answer.earnedPoints,
                timeTaken: answer.timeTaken,
                submittedAnswer: this.formatSubmittedAnswer(question, answer),
            })),
        };
    }

    private formatSubmittedAnswer(question: Question, answer: PlayerAnswer): string {
        if (answer.selectedAnswer) return answer.selectedAnswer.text;
        if (question.type === QuestionType.OPEN_TEXT) {
            return typeof answer.response?.text === 'string' ? answer.response.text : '—';
        }
        if (question.type === QuestionType.MULTIPLE_RESPONSE) {
            const answerById = new Map(question.answers.map((item) => [item.id, item.text]));
            const ids = Array.isArray(answer.response?.answerIds) ? answer.response.answerIds : [];
            return ids.map((id) => answerById.get(String(id)) ?? String(id)).join(', ');
        }
        if (question.type === QuestionType.ORDERING || question.type === QuestionType.FILL_BLANK) {
            const items = new Map((question.configuration?.items ?? []).map((item) => [item.id, item.text]));
            const order = Array.isArray(answer.response?.order) ? answer.response.order : [];
            return order.map((id) => items.get(String(id)) ?? String(id)).join(' → ');
        }
        if (question.type === QuestionType.MATCHING) {
            const pairs = question.configuration?.pairs ?? [];
            const left = new Map(pairs.map((pair) => [pair.leftId, pair.left]));
            const right = new Map(pairs.map((pair) => [pair.rightId, pair.right]));
            const matches = Array.isArray(answer.response?.matches) ? answer.response.matches : [];
            return matches.map((match) => {
                if (!match || typeof match !== 'object') return '—';
                const value = match as Record<string, unknown>;
                return `${left.get(String(value.leftId)) ?? value.leftId} → ${right.get(String(value.rightId)) ?? value.rightId}`;
            }).join('; ');
        }
        return '—';
    }

    async getPlayerFinalResult(playerId: string, includeAnswers: boolean) {
        const player = await this.playersRepo.findOne({
            where: { id: playerId },
            relations: ['session', 'session.quiz', 'session.quiz.questions', 'session.quiz.questions.answers'],
        });
        if (!player) throw new NotFoundException('Player not found');
        const answers = await this.answersRepo.find({
            where: { player_id: playerId },
            relations: ['question', 'question.answers', 'selectedAnswer'],
            order: { answeredAt: 'ASC' },
        });
        const answersByQuestion = new Map(answers.map((answer) => [answer.question_id, answer]));
        const questions = player.questionOrder
            ? player.questionOrder.map((id) => player.session.quiz.questions.find((question) => question.id === id)).filter((question): question is Question => Boolean(question))
            : [...player.session.quiz.questions].sort((a, b) => a.position - b.position);
        const correctCount = answers.filter((answer) => answer.isCorrect).length;
        const accuracy = questions.length ? Math.round(correctCount / questions.length * 100) : 0;
        if (!includeAnswers) return { totalScore: player.totalScore, correctCount, totalAnswers: questions.length, accuracy, passThreshold: player.session.quiz.passThreshold, passed: accuracy >= player.session.quiz.passThreshold };
        return {
            totalScore: player.totalScore,
            correctCount,
            totalAnswers: questions.length,
            accuracy,
            passThreshold: player.session.quiz.passThreshold,
            passed: accuracy >= player.session.quiz.passThreshold,
            answers: questions.map((question) => {
                const answer = answersByQuestion.get(question.id);
                return {
                    question: question.text,
                    explanation: question.explanation || null,
                    submittedAnswer: answer ? this.formatSubmittedAnswer(question, answer) : 'Не відповів',
                    correct: answer?.isCorrect ?? false,
                    earnedPoints: answer?.earnedPoints ?? 0,
                    correctAnswer: this.formatCorrectAnswer(question),
                    practiceQuestion: {
                        id: question.id, text: question.text, type: question.type,
                        mediaUrl: question.mediaUrl, explanation: question.explanation,
                        timeLimit: question.timeLimit, configuration: question.configuration,
                        answers: question.answers.map(({ id, text, mediaUrl, isCorrect }) => ({ id, text, mediaUrl, isCorrect })),
                    },
                };
            }),
        };
    }

    private formatCorrectAnswer(question: Question): string {
        if (question.type === QuestionType.MATCHING) {
            return (question.configuration?.pairs ?? []).map((pair) => `${pair.left} → ${pair.right}`).join('; ');
        }
        if (question.type === QuestionType.ORDERING || question.type === QuestionType.FILL_BLANK) {
            return [...(question.configuration?.items ?? [])]
                .sort((a, b) => a.correctPosition - b.correctPosition)
                .map((item) => item.text).join(' → ');
        }
        return question.answers.filter((answer) => answer.isCorrect).map((answer) => answer.text).join(', ');
    }

    async getAnswersForQuestion(sessionId: string, questionId: string) {
        return this.answersRepo.find({
            where: {
                question_id: questionId,
                player: { session_id: sessionId }
            },
            relations: ["player", "selectedAnswer"],
        });
    }

    async getAnswersForRound(sessionId: string, questionIds: string[], expectedByPlayer?: Record<string, string>) {
        if (questionIds.length === 0) return [];
        const answers = await this.answersRepo.find({
            where: { question_id: In(questionIds), player: { session_id: sessionId } },
            relations: ['player', 'selectedAnswer', 'question'],
        });
        return expectedByPlayer
            ? answers.filter((answer) => expectedByPlayer[answer.player.id] === answer.question_id)
            : answers;
    }

    async hasPlayerAnswered(playerId: string, questionId: string) {
        return this.answersRepo.exists({ where: { player_id: playerId, question_id: questionId } });
    }

    async getSurvivalMistakes(playerId: string, roundIndex: number) {
        const correct = await this.answersRepo.count({ where: { player_id: playerId, isCorrect: true } });
        // Unanswered completed rounds count as mistakes, just like incorrect answers.
        return Math.max(0, roundIndex + 1 - correct);
    }

    async grade(id:string,userId:number,dto:{earnedPoints:number,isCorrect:boolean}){
        const answer=await this.answersRepo.findOne({where:{id},relations:['player','player.session','question','question.quiz']});
        if(!answer||answer.player.session.userId!==userId)throw new NotFoundException('Answer not found');
        const points=Math.max(0,Math.min(Number(dto.earnedPoints)||0,answer.question.points));
        answer.player.totalScore=Math.max(0,answer.player.totalScore-answer.earnedPoints+points);
        answer.earnedPoints=points;answer.isCorrect=Boolean(dto.isCorrect);
        await this.playersRepo.save(answer.player);await this.answersRepo.save(answer);return answer;
    }

    async getRoundStats(sessionId: string, questionIds: string[], expectedByPlayer: Record<string, string>) {
        const answers = await this.getAnswersForRound(sessionId, questionIds, expectedByPlayer);
        return {
            questionType: 'personalized',
            totalAnswers: answers.length,
            correctAnswers: answers.filter((answer) => answer.isCorrect).length,
            accuracy: answers.length ? answers.filter((answer) => answer.isCorrect).length / answers.length : 0,
            answers: [],
            playerBreakdown: answers.map((answer) => ({
                playerId: answer.player.id,
                nickname: answer.player.nickname,
                correct: answer.isCorrect,
                earnedPoints: answer.earnedPoints,
                timeTaken: answer.timeTaken,
                submittedAnswer: this.formatSubmittedAnswer(answer.question, answer),
            })),
        };
    }

}
