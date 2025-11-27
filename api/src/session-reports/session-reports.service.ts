// session-reports.service.ts

import {Injectable, NotFoundException} from "@nestjs/common";
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

        // 1. Load all data
        const players = await this.playersRepo.find({
            where: { session_id: sessionId },
        });

        const answers = await this.answersRepo.find({
            where: { player: In(players.map((p) => p.id)) },
            relations: ['question', 'selectedAnswer'],
        });

        const questions = await this.questionsRepo.find({
            where: { quizId: session.quizId },
            relations: ['answers'],
        });

        // Index maps
        const mapQuestions = Object.fromEntries(questions.map(q => [q.id, q]));
        const mapPlayers = Object.fromEntries(players.map(p => [p.id, p]));

        // Group answers by player
        const answersByPlayer = {};
        for (const ans of answers) {
            if (!answersByPlayer[ans.player_id]) answersByPlayer[ans.player_id] = [];
            answersByPlayer[ans.player_id].push(ans);
        }

        // Group answers by question
        const answersByQuestion = {};
        for (const ans of answers) {
            if (!answersByQuestion[ans.question_id]) answersByQuestion[ans.question_id] = [];
            answersByQuestion[ans.question_id].push(ans);
        }

        // ----- SUMMARY -----
        const totalPlayers = players.length;
        const totalQuestions = questions.length;
        const totalAnswers = answers.length;
        const totalCorrect = answers.filter(a => a.selectedAnswer?.isCorrect).length;
        const globalAccuracy = totalCorrect / totalAnswers || 0;

        const avgAnswerTime =
            answers.length > 0
                ? answers.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / answers.length
                : 0;

        const summary = {
            totalPlayers,
            totalQuestions,
            totalAnswers,
            globalAccuracy,
            avgAnswerTime,
            perQuestionAccuracy: questions.map(q => {
                const arr = answersByQuestion[q.id] || [];
                const correct = arr.filter(a => a.selectedAnswer?.isCorrect).length;
                return {
                    questionId: q.id,
                    accuracy: arr.length ? correct / arr.length : 0,
                };
            }),
        };

        // ----- PLAYERS -----
        const playerStats = players.map((p) => {
            const ans = answersByPlayer[p.id] || [];

            const correctCount = ans.filter(a => a.selectedAnswer?.isCorrect).length;
            const accuracy = ans.length ? correctCount / ans.length : 0;
            const avgTime = ans.length
                ? ans.reduce((sum, a) => sum + (a.timeTaken ?? 0), 0) / ans.length
                : 0;

            return {
                playerId: p.id,
                nickname: p.nickname,
                score: p.totalScore,
                correctCount,
                accuracy,
                avgAnswerTime: avgTime,
                answers: ans.map(a => ({
                    questionId: a.question_id,
                    questionText: mapQuestions[a.question_id].text,
                    selectedAnswerId: a.selectedAnswerId,
                    selectedAnswerText: a.selectedAnswer?.text,
                    correct: a.selectedAnswer?.isCorrect ?? false,
                    timeTaken: a.timeTaken,
                    earnedPoints: a.earnedPoints,
                })),
            };
        });

        // Sort players by score
        playerStats.sort((a, b) => b.score - a.score);
        playerStats.forEach((p, i) => {
            (p as any).place = i + 1;
        });

        // ----- QUESTIONS -----
        const questionStats = questions.map((q) => {
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

            const correctCount = arr.filter(a => a.selectedAnswer?.isCorrect).length;
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
                    playerId: a.player_id,
                    nickname: mapPlayers[a.player_id].nickname,
                    selectedAnswerId: a.selectedAnswerId,
                    correct: a.selectedAnswer?.isCorrect ?? false,
                    timeTaken: a.timeTaken,
                    earnedPoints: a.earnedPoints,
                })),
            };
        });

        // ----- SAVE REPORT -----
        const report = this.reportsRepo.create({
            sessionId,
            summary,
            players: playerStats,
            questions: questionStats,
        });



        return this.reportsRepo.save(report);
    }

    async getReportBySessionId(sessionId: string) {
        return this.reportsRepo.findOne({
            where: { sessionId },
        });
    }

    /**
     * Повернути список всіх звітів, але тільки summary
     */
    async getAllSummaries() {
        // Можна виводити pagination/limit, але min версія проста
        const reports = await this.reportsRepo.find({
            select: {
                id: true,
                sessionId: true,
                summary: true,
                createdAt: true,
            },
            order: {
                createdAt: 'DESC',
            },
        });

        return reports;
    }
}