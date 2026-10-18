import { sessionQuestionCount } from '@/quizzes/question-selection';
// session-reports.service.ts

import {Injectable, NotFoundException, ForbiddenException, BadRequestException} from "@nestjs/common";
import {InjectRepository} from "@nestjs/typeorm";
import {In, Repository} from "typeorm";
import {GameSession} from "@/game-sessions/entities/game-session.entity";
import {PlayerAnswer} from "@/player-answers/entities/player-answer.entity";
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {Question} from "@/questions/entities/question.entity";
import {Answer} from "@/answers/entities/answer.entity";
import {SessionReport} from "@/session-reports/entities/session-report.entity";

@Injectable()
export class SessionReportsService {
    constructor(
        @InjectRepository(GameSession)
        private sessionsRepo: Repository<GameSession>,

        @InjectRepository(GamePlayer)
        private playersRepo: Repository<GamePlayer>,

        @InjectRepository(PlayerAnswer)
        private answersRepo: Repository<PlayerAnswer>,

        @InjectRepository(Question)
        private questionsRepo: Repository<Question>,

        @InjectRepository(Answer)
        private answerOptionsRepo: Repository<Answer>,

        @InjectRepository(SessionReport)
        private reportsRepo: Repository<SessionReport>,
    ) {}

    async generateReport(sessionId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ['quiz'],
        });

        if (!session) throw new NotFoundException('Session not found');

        const players = await this.playersRepo.find({
            where: { session_id: sessionId },
        });

        const answers = await this.answersRepo.find({
            where: { player: { id: In(players.map((p) => p.id)) } },
            relations: ['question', 'selectedAnswer'],
        });

        const questions = await this.questionsRepo.find({
            where: { quizId: session.quizId },
            relations: ['answers'],
        });

        const mapQuestions = Object.fromEntries(questions.map(q => [q.id, q]));
        const mapPlayers = Object.fromEntries(players.map(p => [p.id, p]));

        const answersByPlayer = {};
        for (const ans of answers) {
            if (!answersByPlayer[ans.player_id]) answersByPlayer[ans.player_id] = [];
            answersByPlayer[ans.player_id].push(ans);
        }

        const answersByQuestion = {};
        for (const ans of answers) {
            if (!answersByQuestion[ans.question_id]) answersByQuestion[ans.question_id] = [];
            answersByQuestion[ans.question_id].push(ans);
        }

        const totalPlayers = players.length;
        const totalQuestions = sessionQuestionCount({ ...session, quiz: { ...session.quiz, questions } });
        const totalAnswers = answers.length;
        const totalCorrect = answers.filter(a => a.isCorrect).length;
        const globalAccuracy = totalCorrect / totalAnswers || 0;

        const avgAnswerTime =
            answers.length > 0
                ? answers.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / answers.length
                : 0;

        const summary = {
            totalPlayers,
            totalQuestions,
            poolQuestionCount: questions.length,
            totalAnswers,
            globalAccuracy,
            avgAnswerTime,
            perQuestionAccuracy: questions.map(q => {
                const arr = answersByQuestion[q.id] || [];
                const correct = arr.filter(a => a.isCorrect).length;
                return {
                    questionId: q.id,
                    accuracy: arr.length ? correct / arr.length : 0,
                };
            }),
        };

        const playerStats = players.map((p) => {
            const ans = answersByPlayer[p.id] || [];

            const correctCount = ans.filter(a => a.isCorrect).length;
            const assignedQuestionIds = p.questionOrder || questions.map((q) => q.id);
            const accuracy = assignedQuestionIds.length ? correctCount / assignedQuestionIds.length : 0;
            const avgTime = ans.length
                ? ans.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / ans.length
                : 0;

            return {
                playerId: p.id,
                studentId: p.studentId,
                nickname: p.nickname,
                score: p.totalScore,
                correctCount,
                assignedQuestionIds,
                totalQuestions: assignedQuestionIds.length,
                accuracy,
                avgAnswerTime: avgTime,
                integrityEvents: p.integrityEvents || 0,
                answers: ans.map(a => ({
                    answerId: a.id,
                    questionId: a.question_id,
                    questionText: mapQuestions[a.question_id].text,
                    selectedAnswerId: a.selectedAnswerId,
                    selectedAnswerText: a.selectedAnswer?.text,
                    submittedAnswer: this.formatSubmittedAnswer(mapQuestions[a.question_id], a),
                    correct: a.isCorrect,
                    response: a.response,
                    timeTaken: a.timeTaken,
                    earnedPoints: a.earnedPoints,
                })),
            };
        });

        playerStats.sort((a, b) => b.score - a.score);
        playerStats.forEach((p, i) => {
            (p as any).place = i + 1;
        });

        const questionStats = questions.filter((q) => !players.length || players.some((p) => !p.questionOrder || p.questionOrder.includes(q.id))).map((q) => {
            const arr = answersByQuestion[q.id] || [];

            const answerStats = q.answers.map((opt) => {
                const count = arr.filter(a => a.selectedAnswerId === opt.id).length;
                return {
                    answerId: opt.id,
                    text: opt.text,
                    count,
                    percentage: arr.length ? count / arr.length : 0,
                };
            });

            const correctCount = arr.filter(a => a.isCorrect).length;
            const difficulty =
                arr.length === 0
                    ? 'unknown'
                    : correctCount / arr.length > 0.7
                        ? 'easy'
                        : correctCount / arr.length > 0.35
                            ? 'medium'
                            : 'hard';

            const avgTime =
                arr.length > 0
                    ? arr.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / arr.length
                    : 0;

            return {
                questionId: q.id,
                text: q.text,
                correctAnswerId: q.answers.find(a => a.isCorrect)?.id,
                answerStats,
                difficulty,
                avgAnswerTime: avgTime,
                playerBreakdown: arr.map(a => ({
                    answerId: a.id,
                    playerId: a.player_id,
                    nickname: mapPlayers[a.player_id].nickname,
                    selectedAnswerId: a.selectedAnswerId,
                    submittedAnswer: this.formatSubmittedAnswer(q, a),
                    correct: a.isCorrect,
                    response: a.response,
                    timeTaken: a.timeTaken,
                    earnedPoints: a.earnedPoints,
                })),
            };
        });

        const existing = await this.reportsRepo.findOne({ where: { sessionId } });
        const report = existing
            ? this.reportsRepo.merge(existing, { summary, players: playerStats, questions: questionStats })
            : this.reportsRepo.create({ sessionId, summary, players: playerStats, questions: questionStats });



        return this.reportsRepo.save(report);
    }

    private formatSubmittedAnswer(question: Question, answer: PlayerAnswer): string {
        if (answer.selectedAnswer) return answer.selectedAnswer.text;
        if (question.type === 'open_text') return String(answer.response?.text ?? '—');
        if (question.type === 'ordering') {
            const items = new Map((question.configuration?.items ?? []).map((item) => [item.id, item.text]));
            const order = Array.isArray(answer.response?.order) ? answer.response.order : [];
            return order.map((id) => items.get(String(id)) ?? String(id)).join(' → ');
        }
        if (question.type === 'matching') {
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

    async getReportBySessionId(sessionId: string, userId: number) {
        const session = await this.sessionsRepo.findOne({ where: { id: sessionId }, relations: ['quiz', 'user'] });
        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== userId && !(session.reportSharedWithOwner && session.quiz?.userId === userId)) {
            throw new ForbiddenException('Немає доступу до результатів цього сеансу');
        }
        await this.generateReport(sessionId);
        const report = await this.reportsRepo.findOne({
            where: { sessionId },
            relations: {
                session: {
                    quiz: true,
                },
            },
        });

        if (!report) return null;

        return {
            sessionId: report.sessionId,
            canManageReport: session.userId === userId,
            canShareWithOwner: session.userId === userId && session.quiz?.userId !== userId && session.status === 'FINISHED',
            reportSharedWithOwner: session.reportSharedWithOwner,
            hostName: session.user?.name,
            quiz: {
                id: report.session.quiz.id,
                title: report.session.quiz.title,
                topic: report.session.quiz.topic,
                passThreshold: report.session.quiz.passThreshold,
            },
            summary: report.summary,
            players: report.players,
            questions: report.questions,
            createdAt: report.createdAt,
        };
    }




    async shareWithOwner(sessionId: string, userId: number, shared: boolean) {
        const session = await this.sessionsRepo.findOne({ where: { id: sessionId }, relations: ['quiz'] });
        if (!session) throw new NotFoundException('Session not found');
        if (session.userId !== userId) throw new ForbiddenException('Лише викладач, який проводив тест, може ділитися результатами');
        if (!session.quiz || session.quiz.userId === userId) throw new BadRequestException('Ви вже власник цього квізу');
        if (shared && session.status !== 'FINISHED') throw new BadRequestException('Спочатку завершіть тест');
        if (shared) await this.generateReport(sessionId);
        await this.sessionsRepo.update(sessionId, { reportSharedWithOwner: shared });
        return { shared };
    }

    async getAllSummaries(userId: number) {
        const reports = await this.reportsRepo
            .createQueryBuilder('report')
            .innerJoin('report.session', 'session')
            .innerJoin('session.quiz', 'quiz')
            .leftJoin('session.user', 'host')
            .where('session.user_id = :userId OR (session."reportSharedWithOwner" = true AND quiz.user_id = :userId)', { userId })
            .select([
                'report.sessionId',
                'report.summary',
                'report.players',
                'report.createdAt',
                'session.status',
                'session.userId',
                'session.reportSharedWithOwner',
                'host.name',
                'quiz.id',
                'quiz.title',
            ])
            .orderBy('report.createdAt', 'DESC')
            .getMany();

        return reports.map((report) => ({
            sessionId: report.sessionId,
            quiz: {
                id: report.session.quiz.id,
                title: report.session.quiz.title,
            },
            summary: {
                totalPlayers: report.summary.totalPlayers,
                globalAccuracy: report.summary.globalAccuracy,
                avgAnswerTime: report.summary.avgAnswerTime,
            },
            players: (report.players || []).map((player) => ({
                playerId: player.playerId, studentId: player.studentId, nickname: player.nickname, score: player.score,
                accuracy: player.accuracy, correctCount: player.correctCount,
            })),
            createdAt: report.createdAt,
            status: report.session.status,
            sharedByTeacher: report.session.userId !== userId,
            hostName: report.session.user?.name,
            reportSharedWithOwner: report.session.reportSharedWithOwner,
        }));
    }

}
