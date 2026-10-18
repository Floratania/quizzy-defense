import {
    Injectable,
    NotFoundException,
    BadRequestException,
    ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, LessThan, Repository } from 'typeorm';
import { GameMode, GameSession, GameSessionStatus } from './entities/game-session.entity';
import { Quiz } from '@/quizzes/entities/quiz.entity';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import { GameTeamsService } from '@/game-teams/game-teams.service';
import {quizErrors} from '../quizzes/quiz-quality';

@Injectable()
export class GameSessionsService {
    constructor(
        @InjectRepository(GameSession)
        private readonly sessionsRepo: Repository<GameSession>,
        @InjectRepository(Quiz)
        private readonly quizzesRepo: Repository<Quiz>,
        private readonly teams: GameTeamsService,
    ) {}

    async create(dto: CreateGameSessionDto, userId: number): Promise<GameSession> {
        const quiz = await this.quizzesRepo.findOne({
            where: { id: dto.quizId },
            relations: ['questions','questions.answers'],
        });

        if (!quiz) {
            throw new NotFoundException('Quiz not found');
        }
        if (quiz.userId !== userId) {
            const access = await this.quizzesRepo.query('SELECT 1 FROM quiz_collaborators WHERE "quizId"=$1 AND "userId"=$2', [quiz.id, userId]);
            if (!access.length) throw new ForbiddenException('Немає доступу до запуску цього квізу');
        }
        const now = new Date();
        const errors=quizErrors(quiz.questions);
        if(errors.length) throw new BadRequestException(errors);
        if (quiz.availableFrom && now < quiz.availableFrom) throw new BadRequestException('Quiz is not available yet');
        if (quiz.availableUntil && now > quiz.availableUntil) throw new BadRequestException('Quiz availability has ended');

        const roomCode = await this.generateUniqueRoomCode();

        const session = this.sessionsRepo.create({
            quiz,
            quizId: quiz.id,
            roomCode,
            userId,
            status: GameSessionStatus.WAITING,
            mode: dto.mode ?? GameMode.CLASSIC,
            settings: {
                ...(dto.mode === GameMode.SURVIVAL ? { survivalMistakeLimit: dto.survivalMistakeLimit ?? 1 } : {}),
                passThreshold: quiz.passThreshold, maxAttempts: quiz.maxAttempts,
                requireFullscreen: quiz.requireFullscreen, trackTabSwitches: quiz.trackTabSwitches,
                ...([GameMode.TEAM, GameMode.TOURNAMENT].includes(dto.mode as GameMode) ? {
                    teamCount: dto.mode === GameMode.TOURNAMENT ? (dto.tournamentTeamCount ?? 4) : (dto.teamCount ?? 2),
                    teamAssignment: dto.teamAssignment ?? 'AUTO',
                    ...(dto.mode === GameMode.TOURNAMENT ? { tournamentStages: ['QUALIFICATION', 'SEMIFINAL', 'FINAL'] } : {}),
                } : {}),
            },
            currentQuestionIndex: 0,
        });
        const saved = await this.sessionsRepo.save(session);
        if ([GameMode.TEAM, GameMode.TOURNAMENT].includes(saved.mode)) {
            saved.teams = await this.teams.createForSession(
                saved.id,
                saved.mode === GameMode.TOURNAMENT ? (dto.tournamentTeamCount ?? 4) : (dto.teamCount ?? 2),
                dto.teamNames,
                saved.roomCode,
                dto.teamAssignment === 'CODES',
            );
        }
        return saved;
    }

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


    async getById(id: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { id },
            relations: ['quiz', 'quiz.questions', 'players', 'players.team', 'teams', 'teams.players'],
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        return session;
    }

    async getByRoomCode(code: string): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({
            where: { roomCode: code },
            relations: ['quiz', 'players', 'teams', 'teams.players'],
        });

        if (!session) {
            throw new NotFoundException('Game session not found');
        }

        return session;
    }

    async mergeSettings(id:string,settings:Record<string,unknown>){const session=await this.getById(id);session.settings={...session.settings,...settings};return this.sessionsRepo.save(session);}

    async finishForHost(id: string, userId: number): Promise<GameSession> {
        const session = await this.sessionsRepo.findOne({ where: { id, userId } });
        if (!session) throw new NotFoundException('Game session not found');
        session.status = GameSessionStatus.FINISHED;
        return this.sessionsRepo.save(session);
    }

    async getHostActiveSessions(userId: number): Promise<GameSession[]> {
        const staleBefore = new Date(Date.now() - 6 * 60 * 60 * 1000);
        const emptyLobbyBefore = new Date(Date.now() - 10 * 60 * 1000);
        await this.sessionsRepo.update(
            { userId, status: In([GameSessionStatus.WAITING, GameSessionStatus.RUNNING]), updatedAt: LessThan(staleBefore) },
            { status: GameSessionStatus.FINISHED },
        );

        const candidates = await this.sessionsRepo.find({
            where: { userId, status: In([GameSessionStatus.WAITING, GameSessionStatus.RUNNING]) },
            relations: ['players'],
        });
        const completed = candidates.filter((session) =>
            (session.status === GameSessionStatus.RUNNING && session.players.length > 0 && session.players.every((player) => Boolean(player.completedAt)))
            || (session.status === GameSessionStatus.WAITING && session.players.length === 0 && session.createdAt < emptyLobbyBefore),
        );
        if (completed.length > 0) {
            completed.forEach((session) => { session.status = GameSessionStatus.FINISHED; });
            await this.sessionsRepo.save(completed);
        }

        return this.sessionsRepo.find({
            where: {
                userId,
                status: In([GameSessionStatus.WAITING, GameSessionStatus.RUNNING]),
            },
            relations: ['quiz', 'players', 'players.team', 'teams', 'teams.players'],
            order: { updatedAt: 'DESC' },
        });
    }

    async getQuestionAt(sessionId: string, index: number) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ['quiz', 'quiz.questions', 'quiz.questions.answers'],
        });
        if (!session) throw new NotFoundException('Session not found');
        const questions = [...session.quiz.questions].sort((a, b) => a.position - b.position);
        return { session, question: questions[index] ?? null, totalQuestions: questions.length };
    }

    async getRoundState(sessionId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { id: sessionId },
            relations: ['quiz', 'quiz.questions', 'quiz.questions.answers', 'players', 'players.team'],
        });
        if (!session) throw new NotFoundException('Session not found');
        const orderedQuestions = [...session.quiz.questions].sort((a, b) => a.position - b.position);
        const questionsById = new Map(orderedQuestions.map((question) => [question.id, question]));
        const canonicalQuestion = orderedQuestions[session.currentQuestionIndex] ?? null;
        const playerQuestions = new Map(session.players.map((player) => [
            player.id,
            questionsById.get(player.questionOrder?.[session.currentQuestionIndex] ?? canonicalQuestion?.id ?? '') ?? canonicalQuestion,
        ]));
        return { session, canonicalQuestion, playerQuestions, totalQuestions: orderedQuestions.length };
    }

    async getPlayerQuestion(sessionId: string, playerId: string, index: number) {
        const state = await this.getRoundState(sessionId);
        const player = state.session.players.find((item) => item.id === playerId);
        if (!player) throw new NotFoundException('Player not found');
        const questions = [...state.session.quiz.questions].sort((a, b) => a.position - b.position);
        if (player.questionOrder) return questions.find((question) => question.id === player.questionOrder?.[index]) ?? null;
        return questions[index] ?? null;
    }


    private async generateUniqueRoomCode(length = 6): Promise<string> {
        const digits = '0123456789';

        const generate = () =>
            Array.from({ length })
                .map(() => digits[Math.floor(Math.random() * digits.length)])
                .join('');

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

        const errors=quizErrors(session.quiz.questions);
        if(errors.length) throw new BadRequestException(errors);

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

        const questions = [...session.quiz.questions].sort((a, b) => a.position - b.position);
        const question = questions[session.currentQuestionIndex];

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
