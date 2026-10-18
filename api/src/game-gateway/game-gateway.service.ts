import { sessionQuestionCount } from '@/quizzes/question-selection';
import {GamePlayersService} from "@/game-players/game-players.service";
import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {PlayerAnswersService} from "@/player-answers/player-answers.service";
import {GameSessionsService} from "@/game-sessions/game-sessions.service";
import {SessionReportsService} from "@/session-reports/session-reports.service";
import {GameGateway} from "@/game-gateway/game.gateway";
import {Socket} from "socket.io";
import {JoinSessionDto} from "@/game-gateway/dto/join-session.dto";
import {CreatePlayerAnswerDto} from "@/player-answers/dto/create-player-answer.dto";
import {GameTeamsService} from "@/game-teams/game-teams.service";
import {GameMode} from "@/game-sessions/entities/game-session.entity";
import {Question, QuestionType} from "@/questions/entities/question.entity";
import {QuizFeedbackMode} from '@/quizzes/entities/quiz.entity';
import {JwtService} from '@nestjs/jwt';
import {UnauthorizedException} from '@nestjs/common';

@Injectable()
export class GameFlowService {
    constructor(
        private readonly jwt: JwtService,
        private readonly players: GamePlayersService,
        private readonly sessions: GameSessionsService,
        private readonly answers: PlayerAnswersService,
        private readonly reports: SessionReportsService,
        private readonly teams: GameTeamsService,
        @Inject(forwardRef(() => GameGateway))
        private readonly gateway: GameGateway,
    ) {}

    private questionTimers: Record<string, NodeJS.Timeout> = {};
    private readonly closedRounds = new Set<string>();
    private readonly advancingSessions = new Set<string>();
    private readonly roundDeadlines = new Map<string, number>();

    private pendingAnswers = new Set<string>();
    async logSessionEvent(playerId: string, type: string) {
        const event = await this.players.addSessionEvent(playerId, type);
        if (event) this.gateway.server.to(`host:${event.sessionId}`).emit('session_event', event);
    }
    async playerDisconnected(client: Socket) {
        const player = await this.players.getBySocket(client.id);
        if (!player) return;
        const session = await this.sessions.getById(player.session_id);
        if (session.status !== 'FINISHED') await this.logSessionEvent(player.id, 'DISCONNECTED');
    }


    async authorizeHost(client:Socket, sessionId:string) {
        const userId = client.data.hostUserId || this.authenticatedStudent(client);
        await this.sessions.assertHost(sessionId,userId);
        client.data.hostUserId = userId;
    }

    async hostJoin(client: Socket, sessionId: string) {
        await this.authorizeHost(client,sessionId);
        client.join(sessionId);
        client.join(`host:${sessionId}`);
        client.emit('session_events', await this.players.getSessionEvents(sessionId));
        const session = await this.sessions.getById(sessionId);
        client.emit('host_joined', {
            ok: true,
            status: session.status,
            mode: session.mode,
            players: session.players.map((player) => ({
                id: player.id,
                nickname: player.nickname,
                integrityEvents: player.integrityEvents || 0,
                teamId: player.teamId,
                teamName: player.team?.name ?? null,
                currentQuestionIndex: player.currentQuestionIndex,
                completed: Boolean(player.completedAt),
                eliminated: Boolean(player.eliminatedAt),
            })),
        });
        if ([GameMode.TEAM, GameMode.TOURNAMENT].includes(session.mode)) {
            client.emit('team_leaderboard', await this.teams.getLeaderboard(sessionId));
        }
        if (session.mode === GameMode.TOURNAMENT) {
            const { totalQuestions } = await this.sessions.getQuestionAt(sessionId, 0);
            client.emit('tournament_state', await this.teams.getTournamentState(sessionId, session.currentQuestionIndex, totalQuestions));
        }
        if (session.mode === GameMode.PROGRESS) {
            const { totalQuestions } = await this.sessions.getQuestionAt(sessionId, 0);
            client.emit('progress_snapshot', session.players.map((player) => ({
                playerId: player.id,
                nickname: player.nickname,
                current: Math.min(player.currentQuestionIndex, totalQuestions),
                total: totalQuestions,
                percent: totalQuestions ? Math.round(Math.min(player.currentQuestionIndex, totalQuestions) / totalQuestions * 100) : 100,
                completed: Boolean(player.completedAt),
            })));
        }
        if (session.status === 'RUNNING' && session.mode !== GameMode.PROGRESS) {
            if (this.closedRounds.has(`${sessionId}:${session.currentQuestionIndex}`)) {
                client.emit('leaderboard', await this.players.getLeaderboard(sessionId));
                return;
            }
            const question = await this.sessions.getCurrentQuestion(sessionId);
            client.emit('game_started');
            if (question) {
                const personalized = Boolean(session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions || session.mode === GameMode.TOURNAMENT);
                client.emit('question_started', { ...(personalized ? { timeLimit: question.timeLimit } : this.toPlayableQuestion(question)), endsAt: this.roundDeadlines.get(sessionId), currentQuestionIndex: session.currentQuestionIndex + 1, totalQuestions: sessionQuestionCount(session), personalized });
            }
        }
    }

    async playerJoin(client: Socket, dto: JoinSessionDto) {
        const studentId = this.authenticatedStudent(client);
        if(dto.studentId && dto.studentId !== studentId) throw new UnauthorizedException('Student identity mismatch');
        const player = await this.players.joinSession(dto.roomCode, dto.nickname, client.id, dto.teamId, studentId);

        client.join(player.session_id);

        await this.logSessionEvent(player.id, 'JOINED');

        client.emit('joined_successfully', {
            sessionId: player.session_id,
            playerId: player.id,
            resumeToken: this.jwt.sign({purpose:'player-resume',playerId:player.id,sessionId:player.session_id},{expiresIn:'7d'}),
            teamId: player.teamId,
            teamName: player.team?.name ?? null,
        });

        this.gateway.server.to(player.session_id).emit('player_joined', {
            id: player.id,
            nickname: player.nickname,
            teamId: player.teamId,
            teamName: player.team?.name ?? null,
        });

        const session = await this.sessions.getById(player.session_id);
        if ([GameMode.TEAM, GameMode.TOURNAMENT].includes(session.mode)) {
            this.gateway.server.to(player.session_id).emit('team_leaderboard', await this.teams.getLeaderboard(player.session_id));
        }
    }

    async startGame(sessionId: string) {
        const existing = await this.sessions.getById(sessionId);
        if (existing.mode === GameMode.TOURNAMENT) {
            if (sessionQuestionCount(existing) < 3) {
                throw new Error('Tournament requires at least 3 questions');
            }
            if (existing.teams.some((team) => team.players.length === 0)) {
                throw new Error('Every tournament team must have at least one player');
            }
        }
        const session = await this.sessions.startGame(sessionId);

        this.gateway.server.to(sessionId).emit('game_started');
        if (session.mode === GameMode.PROGRESS) {
            const players = await this.players.getPlayers(sessionId);
            const totalQuestions = sessionQuestionCount(session);
            this.gateway.server.to(sessionId).emit('progress_snapshot', players.map((player) => ({
                playerId: player.id,
                nickname: player.nickname,
                current: 0,
                total: totalQuestions,
                percent: 0,
                completed: false,
            })));
            for (const player of players) await this.sendProgressQuestion(player);
            return;
        }
        await this.startQuestion(sessionId);
    }

    async startQuestion(sessionId: string) {
        const { session, canonicalQuestion: question, playerQuestions } = await this.sessions.getRoundState(sessionId);

        if (!question) return this.finishGame(sessionId);
        clearTimeout(this.questionTimers[sessionId]);

        if (session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions || session.mode === GameMode.TOURNAMENT) {
            const playerSockets = session.players.map((player) => player.socketId).filter(Boolean) as string[];
            this.gateway.server.to(sessionId).except(playerSockets).emit('question_preview', { text: 'Учасники отримують індивідуальні питання', personalized: true });
            for (const player of session.players) {
                const playerQuestion = playerQuestions.get(player.id);
                if (player.socketId && playerQuestion && !player.eliminatedAt) {
                    this.gateway.server.to(player.socketId).emit('question_preview', { text: playerQuestion.text, mediaUrl: playerQuestion.mediaUrl });
                }
            }
        } else {
            this.gateway.server.to(sessionId).emit('question_preview', { text: question.text, mediaUrl: question.mediaUrl });
        }

        setTimeout(async () => {
            for(const player of session.players){
                const current=playerQuestions.get(player.id);
                if(current&&!player.eliminatedAt) await this.players.startQuestionClock(player.id,current.id);
            }
            const roundTimeLimit = Math.max(question.timeLimit, ...[...playerQuestions.values()].filter(Boolean).map((item) => item!.timeLimit));
            const endsAt = Date.now() + roundTimeLimit * 1000;
            this.roundDeadlines.set(sessionId, endsAt);
            if (session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions || session.quiz.shuffleAnswers || session.mode === GameMode.TOURNAMENT) {
                const playerSockets = session.players.map((player) => player.socketId).filter(Boolean) as string[];
                this.gateway.server.to(sessionId).except(playerSockets).emit(
                    'question_started',
                    { ...(session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions || session.mode === GameMode.TOURNAMENT ? {} : this.toPlayableQuestion(question, session.quiz.shuffleAnswers)), timeLimit: roundTimeLimit, endsAt, personalized: Boolean(session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions || session.mode === GameMode.TOURNAMENT), currentQuestionIndex: session.currentQuestionIndex + 1, totalQuestions: sessionQuestionCount(session) },
                );
                for (const player of session.players) {
                    const playerQuestion = playerQuestions.get(player.id);
                    if (player.socketId && playerQuestion && !player.eliminatedAt) {
                        this.gateway.server.to(player.socketId).emit(
                            'question_started',
                            { ...this.toPlayableQuestion(playerQuestion, session.quiz.shuffleAnswers), endsAt: Date.now() + playerQuestion.timeLimit * 1000 },
                        );
                    }
                }
            } else {
                const payload = { ...this.toPlayableQuestion(question, session.quiz.shuffleAnswers), endsAt, currentQuestionIndex: session.currentQuestionIndex + 1, totalQuestions: sessionQuestionCount(session) };
                this.gateway.server.to(sessionId).emit('question_started', payload);
            }

            this.questionTimers[sessionId] = setTimeout(() => {
                this.finishQuestion(sessionId, question.id);
            }, roundTimeLimit * 1000);

        }, 1000);

    }

    async submitAnswer(clientId: string, dto: CreatePlayerAnswerDto) {
        const key=`${clientId}:${dto.questionId}`;
        if(this.pendingAnswers.has(key)) return;
        this.pendingAnswers.add(key);
        try {return await this.processAnswer(clientId,dto);} finally {this.pendingAnswers.delete(key);}
    }

    private async processAnswer(clientId: string, dto: CreatePlayerAnswerDto) {
        const participant = await this.players.getBySocket(clientId);
        if (participant) {
            const active = await this.sessions.getById(participant.session_id);
            if (active.mode !== GameMode.PROGRESS && this.closedRounds.has(`${active.id || participant.session_id}:${active.currentQuestionIndex}`)) {
                this.gateway.server.to(clientId).emit('answer_received', { submitted: true, awaitingNext: true });
                return;
            }
        }
        const result = await this.answers.submitAnswer(
            clientId,
            dto.questionId,
            dto.answerId,
            dto.response,
            dto.timeTaken,
        );

        const session = await this.sessions.getById(result.sessionId);
        const feedbackMode = session.quiz.feedbackMode ?? QuizFeedbackMode.IMMEDIATE;
        this.gateway.server.to(clientId).emit(
            'answer_received',
            feedbackMode === QuizFeedbackMode.IMMEDIATE ? result : { submitted: true },
        );

        let eliminated = false;
        if (session.mode === GameMode.SURVIVAL && !result.correct
            && await this.answers.getSurvivalMistakes(result.playerId, session.currentQuestionIndex) >= Number(session.settings?.survivalMistakeLimit || 1)) {
            await this.players.eliminate(result.playerId);
            eliminated = true;
            this.gateway.server.to(clientId).emit('player_eliminated', { reason: 'incorrect' });
        }

        this.gateway.server.to(result.sessionId).emit('player_answered', {
            playerId: result.playerId,
            eliminated,
        });
        if (session.mode === GameMode.PROGRESS) {
            await this.advanceProgressPlayer(result.sessionId, result.playerId);
            return result;
        }
        if ([GameMode.TEAM, GameMode.TOURNAMENT].includes(session.mode)) {
            this.gateway.server.to(result.sessionId).emit('team_leaderboard', await this.teams.getLeaderboard(result.sessionId));
        }

        const roundState = await this.sessions.getRoundState(result.sessionId);
        const players = roundState.session.players;
        const expectedByPlayer = Object.fromEntries([...roundState.playerQuestions.entries()]
            .filter(([, question]) => Boolean(question))
            .map(([playerId, question]) => [playerId, question!.id]));
        const answers = await this.answers.getAnswersForRound(
            result.sessionId,
            [...new Set(Object.values(expectedByPlayer))],
            expectedByPlayer,
        );

        const answeredPlayerIds = new Set(answers.map((answer) => answer.player.id));
        const roundPlayers = players.filter((player) => !player.eliminatedAt || answeredPlayerIds.has(player.id));
        if (answers.length >= roundPlayers.length) {
            clearTimeout(this.questionTimers[result.sessionId]);
            delete this.questionTimers[result.sessionId];

            await this.finishQuestion(result.sessionId, dto.questionId);
        }

        return result;
    }

    async playerResume(client: Socket, sessionId: string, playerId: string, resumeToken?: string) {
        const stored = await this.players.getOne(playerId);
        if(!stored || stored.session_id !== sessionId) throw new UnauthorizedException('Invalid player session');
        if(stored.studentId) {
            if(this.authenticatedStudent(client) !== stored.studentId) throw new UnauthorizedException('Player belongs to another student');
        } else {
            try {
                const claims=this.jwt.verify(resumeToken || '');
                if(claims.purpose!=='player-resume'||claims.playerId!==playerId||claims.sessionId!==sessionId) throw new Error();
            } catch { throw new UnauthorizedException('Invalid resume token'); }
        }
        const player = await this.players.resume(playerId, sessionId, client.id);
        client.join(sessionId);
        const session = await this.sessions.getById(sessionId);
        client.emit('session_resumed', { ok: true, settings: session.settings });
        if (stored.socketId !== client.id && session.status !== 'FINISHED') await this.logSessionEvent(player.id, 'RECONNECTED');

        if (session.status === 'FINISHED' || (stored.completedAt && session.settings?.classId)) return client.emit('game_finished', {
            feedbackMode: session.quiz.feedbackMode,
            result: await this.answers.getPlayerFinalResult(player.id, session.quiz.feedbackMode !== QuizFeedbackMode.END_SCORE_ONLY),
        });
        if (player.completedAt) return client.emit('player_completed');
        if (player.eliminatedAt) return client.emit('player_eliminated', { reason: 'eliminated' });
        if (session.status !== 'RUNNING') return;
        if (session.mode !== GameMode.PROGRESS && this.closedRounds.has(`${sessionId}:${session.currentQuestionIndex}`)) return client.emit('answer_received', { submitted: true, awaitingNext: true });

        const index = session.mode === GameMode.PROGRESS ? player.currentQuestionIndex : session.currentQuestionIndex;
        const question = await this.sessions.getPlayerQuestion(sessionId, playerId, index);
        if (!question) return client.emit('player_completed');
        if (await this.answers.hasPlayerAnswered(playerId, question.id)) {
            return client.emit('answer_received', { submitted: true });
        }
        if(session.mode===GameMode.PROGRESS)return this.sendProgressQuestion(player);
        client.emit('question_started', { ...this.toPlayableQuestion(question, session.quiz.shuffleAnswers), endsAt: player.questionStartedAt ? new Date(player.questionStartedAt).getTime() + question.timeLimit * 1000 : undefined });
    }

    private async sendProgressQuestion(player: { id: string; session_id: string; socketId?: string; currentQuestionIndex: number }) {
        const state = await this.sessions.getRoundState(player.session_id);
        const question = await this.sessions.getPlayerQuestion(player.session_id, player.id, player.currentQuestionIndex);
        const totalQuestions = state.totalQuestions;
        if (!player.socketId || !question) return;
        await this.players.startQuestionClock(player.id,question.id);
        const clock=await this.players.getOne(player.id);
        const endsAt=(clock?.questionStartedAt?new Date(clock.questionStartedAt).getTime():Date.now())+question.timeLimit*1000;
        setTimeout(async()=>{
            const current=await this.players.getOne(player.id);
            if(current?.socketId && current.activeQuestionId===question.id && !await this.answers.hasPlayerAnswered(player.id,question.id)) {
                await this.submitAnswer(current.socketId,{questionId:question.id,response:{timedOut:true},timeTaken:0}).catch(()=>undefined);
            }
        },Math.max(0,endsAt-Date.now()));
        this.gateway.server.to(player.socketId).emit('question_started', {
            ...this.toPlayableQuestion(question, state.session.quiz.shuffleAnswers),
            endsAt,
            currentQuestionIndex: player.currentQuestionIndex + 1,
            totalQuestions,
        });
    }

    private async advanceProgressPlayer(sessionId: string, playerId: string) {
        const state = await this.sessions.getQuestionAt(sessionId, 0);
        const storedPlayer = await this.players.getOne(playerId);
        const totalQuestions = storedPlayer?.questionOrder?.length || state.totalQuestions;
        const player = await this.players.advanceProgress(playerId, totalQuestions);
        this.gateway.server.to(sessionId).emit('progress_updated', {
            playerId: player.id,
            nickname: player.nickname,
            current: Math.min(player.currentQuestionIndex, totalQuestions),
            total: totalQuestions,
            percent: totalQuestions ? Math.round(Math.min(player.currentQuestionIndex, totalQuestions) / totalQuestions * 100) : 100,
            completed: Boolean(player.completedAt),
        });

        if (player.completedAt) {
            if (player.socketId) this.gateway.server.to(player.socketId).emit('player_completed');
            if (state.session.settings?.classId) {
                if(player.socketId)this.gateway.server.to(player.socketId).emit('game_finished',{feedbackMode:state.session.quiz.feedbackMode,result:await this.answers.getPlayerFinalResult(player.id,state.session.quiz.feedbackMode!==QuizFeedbackMode.END_SCORE_ONLY)});
                return;
            }
            const allPlayers = await this.players.getPlayers(sessionId);
            if (allPlayers.length > 0 && allPlayers.every((item) => item.completedAt)) await this.finishGame(sessionId);
            return;
        }

        setTimeout(() => this.sendProgressQuestion(player), 1500);
    }


    async finishQuestion(sessionId: string, questionId: string) {
        const roundState = await this.sessions.getRoundState(sessionId);
        const session = roundState.session;
        const roundKey = `${sessionId}:${session.currentQuestionIndex}`;
        if (this.closedRounds.has(roundKey) || session.status === 'FINISHED') return;
        this.closedRounds.add(roundKey);
        clearTimeout(this.questionTimers[sessionId]);
        delete this.questionTimers[sessionId];
        for (const player of session.players.filter((item) => !item.eliminatedAt)) {
            const assigned = roundState.playerQuestions.get(player.id);
            if (assigned && !await this.answers.hasPlayerAnswered(player.id, assigned.id)) {
                try {
                    const result = await this.answers.recordTimeout(player.id, assigned.id);
                    if (player.socketId) this.gateway.server.to(player.socketId).emit('answer_received', session.quiz.feedbackMode === QuizFeedbackMode.IMMEDIATE ? { ...result, timedOut: true } : { submitted: true, timedOut: true });
                    this.gateway.server.to(`host:${sessionId}`).emit('player_answered', { playerId: player.id, timedOut: true });
                } catch {
                    if (!await this.answers.hasPlayerAnswered(player.id, assigned.id)) throw new Error('Could not persist question timeout');
                }
            }
            if (player.socketId) this.gateway.server.to(player.socketId).emit('question_closed', { questionId: assigned?.id });
        }
        const expectedByPlayer = Object.fromEntries([...roundState.playerQuestions.entries()]
            .filter(([, question]) => Boolean(question))
            .map(([playerId, question]) => [playerId, question!.id]));
        const roundQuestionIds = [...new Set(Object.values(expectedByPlayer))];
        if (session.mode === GameMode.SURVIVAL) {
            const players = session.players;
            const answers = await this.answers.getAnswersForRound(sessionId, roundQuestionIds, expectedByPlayer);
            const answeredPlayerIds = new Set(answers.map((answer) => answer.player.id));
            for (const player of players.filter((item) => !item.eliminatedAt && !answeredPlayerIds.has(item.id))) {
                if (await this.answers.getSurvivalMistakes(player.id, session.currentQuestionIndex) < Number(session.settings?.survivalMistakeLimit || 1)) continue;
                await this.players.eliminate(player.id);
                if (player.socketId) this.gateway.server.to(player.socketId).emit('player_eliminated', { reason: 'timeout' });
                this.gateway.server.to(sessionId).emit('player_eliminated_host', { playerId: player.id, reason: 'timeout' });
            }
        }
        const stats = (session.quiz.questionSelection || session.settings?.questionSelection || session.quiz.shuffleQuestions)
            ? await this.answers.getRoundStats(sessionId, roundQuestionIds, expectedByPlayer)
            : await this.answers.getQuestionStats(sessionId, questionId);

        this.gateway.server.to(`host:${sessionId}`).emit('question_results', { ...stats, roundClosed: true, message: 'Раунд завершено. Після таблиці результатів натисніть «Наступне питання».' });

        setTimeout(async () => {
            const updatedSession = await this.sessions.getById(sessionId);
            const leaderboard = [GameMode.TEAM, GameMode.TOURNAMENT].includes(updatedSession.mode)
                ? await this.teams.getLeaderboard(sessionId)
                : await this.players.getLeaderboard(sessionId);

            const survivors = updatedSession.players.filter((player) => !player.eliminatedAt);
            const survivalFinished = updatedSession.mode === GameMode.SURVIVAL
                && updatedSession.players.length > 0
                && (survivors.length === 0 || (updatedSession.players.length > 1 && survivors.length === 1));
            const nextQuestion = await this.sessions.peekNextQuestion(sessionId);
            if (survivalFinished || !nextQuestion) {
                await this.finishGame(sessionId, leaderboard);
                return;
            }
            this.gateway.server.to(updatedSession.settings?.showQuestionLeaderboard === true ? sessionId : `host:${sessionId}`).emit('leaderboard', leaderboard);
            if (updatedSession.mode === GameMode.TOURNAMENT) {
                const { totalQuestions } = await this.sessions.getQuestionAt(sessionId, 0);
                this.gateway.server.to(sessionId).emit(
                    'tournament_state',
                    await this.teams.getTournamentState(sessionId, updatedSession.currentQuestionIndex, totalQuestions),
                );
            }


        }, 3000);
    }

    private toPlayableQuestion(question: Question, shuffleAnswers = false) {
        const base = {
            id: question.id,
            type: question.type,
            text: question.text,
            mediaUrl: question.mediaUrl,
            answers: question.type === QuestionType.OPEN_TEXT
                ? []
                : (shuffleAnswers ? this.shuffle(question.answers) : question.answers).map((answer) => ({
                    id: answer.id,
                    text: answer.text,
                    imageUrl: answer.mediaUrl,
                    mediaUrl: answer.mediaUrl,
                })),
            timeLimit: question.timeLimit,
        };

        if (question.type === QuestionType.MATCHING) {
            const pairs = question.configuration?.pairs ?? [];
            return {
                ...base,
                configuration: {
                    leftItems: this.shuffle(pairs.map(({ leftId, left }) => ({ id: leftId, text: left }))),
                    rightItems: this.shuffle(pairs.map(({ rightId, right }) => ({ id: rightId, text: right }))),
                },
            };
        }
        if (question.type === QuestionType.ORDERING) {
            return {
                ...base,
                configuration: {
                    items: this.shuffle((question.configuration?.items ?? []).map(({ id, text }) => ({ id, text }))),
                },
            };
        }
        if (question.type === QuestionType.FILL_BLANK) {
            return {
                ...base,
                answers: [],
                configuration: {
                    items: this.shuffle((question.configuration?.items ?? []).map(({ id, text }) => ({ id, text }))),
                    blankCount: (question.text.match(/___/g) || []).length,
                },
            };
        }
        return base;
    }

    private authenticatedStudent(client: Socket): number | undefined {
        const token=client.handshake.auth?.token;
        if(!token) return undefined;
        try {
            const claims=this.jwt.verify(token);
            if(claims.purpose || !Number.isInteger(claims.id) || claims.id<=0) throw new Error();
            return claims.id;
        } catch { throw new UnauthorizedException('Invalid authentication token'); }
    }

    private shuffle<T>(items: T[]): T[] {
        return [...items].sort(() => Math.random() - 0.5);
    }


    async nextQuestion(sessionId: string) {
        if (this.advancingSessions.has(sessionId)) return;
        const current = await this.sessions.getById(sessionId);
        if (current.status === 'FINISHED' || !this.closedRounds.has(`${sessionId}:${current.currentQuestionIndex}`)) return;
        this.advancingSessions.add(sessionId);
        try {
        await this.sessions.increaseQuestionIndex(sessionId);

        const next = await this.sessions.getCurrentQuestion(sessionId);

        if (!next) {
            return this.finishGame(sessionId);
        }

        const session = await this.sessions.getById(sessionId);
        if (session.mode === GameMode.TOURNAMENT) {
            const { totalQuestions } = await this.sessions.getQuestionAt(sessionId, 0);
            const tournament = await this.teams.getTournamentState(sessionId, session.currentQuestionIndex, totalQuestions);
            const qualificationEnd = Math.max(1, Math.ceil(totalQuestions / 3));
            const semifinalEnd = Math.max(qualificationEnd + 1, Math.ceil(totalQuestions * 2 / 3));
            if ([qualificationEnd, semifinalEnd].includes(session.currentQuestionIndex)) {
                for (const player of session.players.filter((item) => item.teamId && !tournament.activeTeamIds.includes(item.teamId) && !item.eliminatedAt)) {
                    await this.players.eliminate(player.id);
                    if (player.socketId) this.gateway.server.to(player.socketId).emit('player_eliminated', { reason: 'tournament' });
                    this.gateway.server.to(sessionId).emit('player_eliminated_host', { playerId: player.id, reason: 'tournament' });
                }
            }
            this.gateway.server.to(sessionId).emit(
                'tournament_state',
                tournament,
            );
        }
        return await this.startQuestion(sessionId);
        } finally { this.advancingSessions.delete(sessionId); }
    }

    async finishGame(sessionId: string, finalLeaderboard?: unknown[]) {
        const session = await this.sessions.getById(sessionId);
        if (session.mode === GameMode.TOURNAMENT) {
            const { totalQuestions } = await this.sessions.getQuestionAt(sessionId, 0);
            this.gateway.server.to(sessionId).emit(
                'tournament_state',
                await this.teams.getTournamentState(sessionId, totalQuestions, totalQuestions),
            );
        }
        await this.sessions.finish(sessionId);
        if (finalLeaderboard) this.gateway.server.to(`host:${sessionId}`).emit('final_leaderboard', finalLeaderboard);
        clearTimeout(this.questionTimers[sessionId]);
        delete this.questionTimers[sessionId];
        this.roundDeadlines.delete(sessionId);
        const feedbackMode = session.quiz.feedbackMode ?? QuizFeedbackMode.IMMEDIATE;
        for (const player of session.players) {
            if (!player.socketId) continue;
            const result = await this.answers.getPlayerFinalResult(
                player.id,
                feedbackMode !== QuizFeedbackMode.END_SCORE_ONLY,
            );
            this.gateway.server.to(player.socketId).emit('game_finished', { feedbackMode, result });
        }
        this.gateway.server.to(sessionId).emit('game_finished');
        await this.reports.generateReport(sessionId);
    }
}
