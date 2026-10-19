import { selectBalancedQuestions, QuestionSelection } from '@/quizzes/question-selection';
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Raw, Repository } from 'typeorm';
import { GamePlayer } from './entities/game-player.entity';
import { GameSession, GameSessionStatus } from '@/game-sessions/entities/game-session.entity';
import { SessionTeam } from '@/game-teams/entities/session-team.entity';
import { SessionEvent } from './entities/session-event.entity';

@Injectable()
export class GamePlayersService {
    private readonly hiddenPlayers = new Set<string>();
    constructor(
        @InjectRepository(GamePlayer)
        private readonly playersRepo: Repository<GamePlayer>,

        @InjectRepository(GameSession)
        private readonly sessionsRepo: Repository<GameSession>,
        @InjectRepository(SessionTeam)
        private readonly teamsRepo: Repository<SessionTeam>,
    ) {}

    async canResume(playerId: string, sessionId: string) {
        const player = await this.playersRepo.findOne({where:{id:playerId,session_id:sessionId},relations:['session']});
        if (!player || player.completedAt || player.eliminatedAt) return false;
        const session = player.session;
        if (![GameSessionStatus.WAITING, GameSessionStatus.RUNNING].includes(session.status)) return false;
        const deadline = session.settings?.assignmentDueAt;
        return !deadline || new Date(String(deadline)).getTime() > Date.now();
    }

    async getLeaderboard(sessionId: string) {
        return this.playersRepo.find({
            where: { session_id: sessionId },
            order: { totalScore: "DESC" },
            take: 10
        });
    }

    async getPlayers(sessionId: string) {
        return await this.playersRepo.find({
            where: { session_id: sessionId }
        });
    }

    async joinSession(roomCode: string, nickname: string, socketId: string, requestedTeamId?: string, studentId?: number) {
        const session = await this.sessionsRepo.findOne({
            where: [
                { roomCode },
                { teams: { joinCode: roomCode } },
            ],
            relations: ['players', 'teams', 'teams.players', 'quiz', 'quiz.questions'],
        });

        if (!session) throw new NotFoundException('Session not found');
        const now = new Date();
        if (session.status === GameSessionStatus.FINISHED) throw new BadRequestException('Тест уже завершено');
        if (session.settings?.classId) {
            const membership=studentId && await this.playersRepo.query('SELECT 1 FROM class_students WHERE class_id=$1 AND student_id=$2',[session.settings.classId,studentId]);
            if(!membership?.length)throw new BadRequestException('Увійдіть в акаунт учня, якому призначено цей тест');
            if(session.settings.assignmentOpensAt && now < new Date(String(session.settings.assignmentOpensAt)))throw new BadRequestException('Тест ще не відкрито');
            if(session.settings.assignmentDueAt && now > new Date(String(session.settings.assignmentDueAt)))throw new BadRequestException('Термін виконання завершився');
        }

        if (session.quiz.availableFrom && now < session.quiz.availableFrom) throw new BadRequestException('Quiz is not available yet');
        if (session.quiz.availableUntil && now > session.quiz.availableUntil) throw new BadRequestException('Quiz availability has ended');
        if (session.quiz.maxAttempts > 0) {
            const attempts = await this.playersRepo.count({ where: studentId ? { studentId, session: { quizId: session.quizId } } : { nickname, session: { quizId: session.quizId } } });
            if (attempts >= session.quiz.maxAttempts) throw new BadRequestException('Attempt limit reached');
        }
        const assignmentMaxAttempts=Number(session.settings?.assignmentMaxAttempts||0);
        if(assignmentMaxAttempts>0){const attempts=await this.playersRepo.count({where:studentId?{studentId,session_id:session.id}:{nickname,session_id:session.id}});if(attempts>=assignmentMaxAttempts)throw new BadRequestException('Assignment attempt limit reached');}
        if (session.status !== GameSessionStatus.WAITING && session.mode !== 'PROGRESS')
            throw new BadRequestException('This session is not open for joining');

        // Check duplicates
        const sameName = session.players.find((p) => p.nickname === nickname && !(session.settings?.classId && p.studentId === studentId && p.completedAt));
        if (sameName) throw new BadRequestException('Nickname already taken');

        let team: SessionTeam | null = null;
        if (session.mode === 'TEAM' || session.mode === 'TOURNAMENT') {
            const teamFromCode = session.teams.find((candidate) => candidate.joinCode === roomCode) ?? null;
            team = requestedTeamId
                ? session.teams.find((candidate) => candidate.id === requestedTeamId) ?? null
                : teamFromCode ?? [...session.teams].sort((a, b) => a.players.length - b.players.length)[0] ?? null;
            if (!team) throw new BadRequestException('Team not found');
        }

        const player = this.playersRepo.create({
            nickname,
            studentId: studentId || null,
            session,
            session_id: session.id,
            socketId,
            totalScore: 0,
            currentQuestionIndex: 0,
            completedAt: null,
            eliminatedAt: null,
            questionOrder: (() => {
                const selection = session.settings?.questionSelection as QuestionSelection | undefined ?? session.quiz.questionSelection;
                if (selection) return selectBalancedQuestions(session.quiz.questions, selection);
                const ids = [...session.quiz.questions].sort((a, b) => a.position - b.position).map((question) => question.id);
                const randomized = session.quiz.shuffleQuestions || Boolean(session.settings?.randomForEachStudent) ? this.shuffle(ids) : ids;
                const limit = Number(session.settings?.questionCount || 0);
                return limit > 0 ? randomized.slice(0, limit) : randomized;
            })(),
            team,
            teamId: team?.id ?? null,
        });

        return this.playersRepo.save(player);
    }

    async updateSocket(playerId: string, socketId: string) {
        await this.playersRepo.update(playerId, { socketId });
    }
    getOne(id:string){return this.playersRepo.findOneBy({id});}
    getBySocket(socketId: string) { return this.playersRepo.findOneBy({ socketId }); }
    async addSessionEvent(playerId: string, type: string) {
        const player = await this.getOne(playerId);
        if (!player) return null;
        const repo = this.playersRepo.manager.getRepository(SessionEvent);
        return repo.save(repo.create({ sessionId: player.session_id, playerId, nickname: player.nickname, type }));
    }
    getSessionEvents(sessionId: string) {
        return this.playersRepo.manager.getRepository(SessionEvent).find({ where: { sessionId }, order: { createdAt: 'DESC', id: 'DESC' }, take: 200 });
    }
    async startQuestionClock(id:string,questionId:string){
        await this.playersRepo.update({id,activeQuestionId:Raw(alias=>`${alias} IS DISTINCT FROM :questionId`,{questionId})},{activeQuestionId:questionId,questionStartedAt:new Date()});
    }

    async recordIntegrityEvent(socketId: string, hidden = true) {
        const player = await this.playersRepo.findOne({ where: { socketId }, relations: ['session'] });
        if (!hidden) { if (player) this.hiddenPlayers.delete(player.id); return null; }
        if (!player || player.session.status !== 'RUNNING' || !player.session.settings?.trackTabSwitches || player.completedAt || player.eliminatedAt) return null;
        if (this.hiddenPlayers.has(player.id)) return null;
        this.hiddenPlayers.add(player.id);
        try {
        await this.playersRepo.increment({ id: player.id }, 'integrityEvents', 1);
        const updated = await this.playersRepo.findOneBy({ id: player.id });
        return { sessionId: player.session_id, playerId: player.id, integrityEvents: updated?.integrityEvents || 0 };
        } catch (error) { this.hiddenPlayers.delete(player.id); throw error; }
    }

    async resume(playerId: string, sessionId: string, socketId: string) {
        const player = await this.playersRepo.findOne({
            where: { id: playerId, session_id: sessionId },
            relations: ['team'],
        });
        if (!player) throw new NotFoundException('Player session not found');
        player.socketId = socketId;
        return this.playersRepo.save(player);
    }

    private shuffle<T>(items: T[]): T[] {
        for (let index = items.length - 1; index > 0; index--) {
            const target = Math.floor(Math.random() * (index + 1));
            [items[index], items[target]] = [items[target], items[index]];
        }
        return items;
    }

    async eliminate(playerId: string) {
        const player = await this.playersRepo.findOne({ where: { id: playerId } });
        if (!player) throw new NotFoundException('Player not found');
        if (!player.eliminatedAt) {
            player.eliminatedAt = new Date();
            await this.playersRepo.save(player);
        }
        return player;
    }

    async advanceProgress(playerId: string, totalQuestions: number) {
        const player = await this.playersRepo.findOne({ where: { id: playerId } });
        if (!player) throw new NotFoundException('Player not found');
        player.currentQuestionIndex += 1;
        if (player.currentQuestionIndex >= totalQuestions) player.completedAt = new Date();
        return this.playersRepo.save(player);
    }
}
