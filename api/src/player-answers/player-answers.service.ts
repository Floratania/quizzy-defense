import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlayerAnswer } from './entities/player-answer.entity';
import { GamePlayer } from '@/game-players/entities/game-player.entity';
import { Question } from '@/questions/entities/question.entity';
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

    async submitAnswer(playerSocketId: string, questionId: string, answerId: string, timeTaken: number) {
        // 1. Find player
        const player = await this.playersRepo.findOne({
            where: {socketId: playerSocketId},
            relations: ['session'],
        });

        if (!player) throw new NotFoundException('Player not found');

        // 2. Validate question
        const question = await this.questionsRepo.findOne({
            where: {id: questionId},
            relations: ['answers'],
        });

        if (!question) throw new NotFoundException('Question not found');

        // 3. Validate answer
        const selectedAnswer = await this.answersRepo2.findOne({
            where: {id: answerId},
        });

        if (!selectedAnswer) throw new NotFoundException('Answer not found');

        // Ensure answer belongs to the question
        if (!question.answers.some(a => a.id === answerId)) {
            throw new BadRequestException('Answer does not belong to this question');
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

        // 5. Determine correctness
        const isCorrect = selectedAnswer.isCorrect;

        // 6. Calculate score
        let earnedPoints = 0;

        if (isCorrect) {
            const base = 1000;
            const penalty = Math.floor(timeTaken / 100); // 100 ms = -1 point
            earnedPoints = Math.max(base - penalty, 100); // min 100 points
        }

        // 7. Save PlayerAnswer
        const playerAnswer = this.answersRepo.create({
            player,
            player_id: player.id,
            question,
            question_id: questionId,
            selectedAnswer,
            selectedAnswerId: answerId,
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
            earnedPoints,
            totalScore: player.totalScore,
        };
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

        const resultAnswers = question.answers.map(answer => ({
            id: answer.id,
            text: answer.text,
            isCorrect: answer.isCorrect,
            count: countMap[answer.id] || 0,
        }));

        return {
            questionId,
            totalAnswers,
            answers: resultAnswers,
        };
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

}
