import {
    Injectable,
    NotFoundException,
    BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GameSession, GameSessionStatus } from './entities/game-session.entity';
import { Quiz } from '@/quizzes/entities/quiz.entity';
import { CreateGameSessionDto } from './dto/create-game-session.dto';

@Injectable()
export class GameSessionsService {
    constructor(
        @InjectRepository(GameSession)
        private readonly sessionsRepo: Repository<GameSession>,
        @InjectRepository(Quiz)
        private readonly quizzesRepo: Repository<Quiz>,
    ) {}

    /**
     * Створити сесію: прив'язати до вікторини, згенерувати унікальний roomCode, встановити статус WAITING
     */
    async create(dto: CreateGameSessionDto): Promise<GameSession> {
        const quiz = await this.quizzesRepo.findOne({
            where: { id: dto.quizId },
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }

        const roomCode = await this.generateUniqueRoomCode();

        const session = this.sessionsRepo.create({
            quiz,
            quizId: quiz.id,
            roomCode,
            status: GameSessionStatus.WAITING,
            currentQuestionIndex: 0,
        });

        return this.sessionsRepo.save(session);
    }

    /**
     * Старт гри: статус → RUNNING, currentQuestionIndex = 0
     * (далі тут буде тригер старту першого питання / WS-події)
     */
    async start(id: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { id },
            relations: ['quiz'],
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        if (session.status !== GameSessionStatus.WAITING) {
            throw new BadRequestException(
                `Cannot start session in status ${session.status}`,
            );
        }

        session.status = GameSessionStatus.RUNNING;
        session.currentQuestionIndex = 0;

        return this.sessionsRepo.save(session);
    }

    /**
     * Завершити гру: статус → FINISHED
     * (потім можна буде викликати з WS, коли закінчаться питання)
     */
    async finish(id: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { id },
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        if (session.status === GameSessionStatus.FINISHED) {
            return session;
        }

        session.status = GameSessionStatus.FINISHED;

        return this.sessionsRepo.save(session);
    }

    /**
     * Отримати сесію за id
     */
    async getById(id: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { id },
            relations: ['quiz', 'players'],
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        return session;
    }

    /**
     * Отримати сесію за roomCode (для join по коду)
     */
    async getByRoomCode(code: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { roomCode: code },
            relations: ['quiz', 'players'],
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        return session;
    }

    /**
     * Генерація унікального roomCode
     * Зараз: 6-значний числовий код
     */
    private async generateUniqueRoomCode(length = 6): Promise<string> {
        const digits = '0123456789';

        const generate = () =>
            Array.from({ length })
                .map(() => digits[Math.floor(Math.random() * digits.length)])
                .join('');

        // На випадок дуже рідких колізій робимо кілька спроб
        for (let attempt = 0; attempt < 10; attempt++) {
            const code = generate();

            const existing = await this.sessionsRepo.findOne({
                where: { roomCode: code },
            });

            if (!existing) {
                return code;
            }
        }

        throw new Error('Failed to generate unique room code');
    }

    async startGame(sessionId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ['quiz', 'quiz.questions', 'quiz.questions.answers'],
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== GameSessionStatus.WAITING)
            throw new BadRequestException('Game already started');

        session.status = GameSessionStatus.RUNNING;
        session.currentQuestionIndex = 0;

        await this.sessionsRepo.save(session);
        return session;
    }

    // async getSessionState(sessionId: string) {
    //     const session = this.sessionsRepo.get(sessionId);
    //
    //     if (!session) {
    //         return {
    //             players: [],
    //             gameStarted: false,
    //             preview: null,
    //             question: null,
    //             results: null,
    //             leaderboard: null,
    //             currentQuestionIndex: 0,
    //             timeLeft: 0,
    //         };
    //     }
    //
    //     return {
    //         players: session.players,
    //         gameStarted: session.gameStarted,
    //         preview: session.preview,
    //         question: session.currentQuestion,
    //         results: session.results,
    //         leaderboard: session.leaderboard,
    //         currentQuestionIndex: session.currentQuestionIndex,
    //         timeLeft: session.timeLeft,
    //     };
    // }


    async getCurrentQuestion(sessionId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ['quiz', 'quiz.questions', 'quiz.questions.answers'],
        });

        if (!session) throw new NotFoundException('Session not found');

        const question = session.quiz.questions[session.currentQuestionIndex];

        if (!question) return null;

        return question;
    }

    async increaseQuestionIndex(sessionId: string) {
        const session = await this.sessionsRepo.findOne({ where: { id: sessionId } });

        if (!session) throw new NotFoundException('Session not found');


        session.currentQuestionIndex += 1;
        return this.sessionsRepo.save(session);
    }

    async peekNextQuestion(sessionId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ["quiz", "quiz.questions"],
        });

        if (!session) throw new NotFoundException('Session not found');

        const nextIndex = session.currentQuestionIndex + 1;

        return session.quiz.questions[nextIndex] ?? null;
    }
}
