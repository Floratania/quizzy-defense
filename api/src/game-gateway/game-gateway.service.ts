import {GamePlayersService} from "@/game-players/game-players.service";
import {forwardRef, Inject, Injectable} from "@nestjs/common";
import {PlayerAnswersService} from "@/player-answers/player-answers.service";
import {GameSessionsService} from "@/game-sessions/game-sessions.service";
import {SessionReportsService} from "@/session-reports/session-reports.service";
import {GameGateway} from "@/game-gateway/game.gateway";
import {Socket} from "socket.io";
import {JoinSessionDto} from "@/game-gateway/dto/join-session.dto";
import {CreatePlayerAnswerDto} from "@/player-answers/dto/create-player-answer.dto";

@Injectable()
export class GameFlowService {
    constructor(
        private readonly players: GamePlayersService,
        private readonly sessions: GameSessionsService,
        private readonly answers: PlayerAnswersService,
        private readonly reports: SessionReportsService,
        @Inject(forwardRef(() => GameGateway))
        private readonly gateway: GameGateway,
    ) {}

    private questionTimers: Record<string, NodeJS.Timeout> = {};


    async hostJoin(client: Socket, sessionId: string) {
        client.join(sessionId);
        client.emit('host_joined', { ok: true });
    }

    async playerJoin(client: Socket, dto: JoinSessionDto) {
        const player = await this.players.joinSession(dto.roomCode, dto.nickname, client.id);

        client.join(player.session_id);

        client.emit('joined_successfully', {
            sessionId: player.session_id,
            playerId: player.id,
        });

        this.gateway.server.to(player.session_id).emit('player_joined', {
            id: player.id,
            nickname: player.nickname,
        });
    }

    async startGame(sessionId: string) {
        await this.sessions.startGame(sessionId);

        this.gateway.server.to(sessionId).emit('game_started');
        await this.startQuestion(sessionId);
    }

    async startQuestion(sessionId: string) {
        const question = await this.sessions.getCurrentQuestion(sessionId);

        if (!question) return this.finishGame(sessionId);

        this.gateway.server.to(sessionId).emit('question_preview', {
            text: question.text,
        });

        setTimeout(() => {
            this.gateway.server.to(sessionId).emit('question_started', {
                id: question.id,
                text: question.text,
                answers: question.answers.map(a => ({ id: a.id, text: a.text })),
                timeLimit: question.timeLimit,
            });

            this.questionTimers[sessionId] = setTimeout(() => {
                this.finishQuestion(sessionId, question.id);
            }, question.timeLimit * 1000);

        }, 1000);

    }

    async submitAnswer(clientId: string, dto: CreatePlayerAnswerDto) {
        const result = await this.answers.submitAnswer(
            clientId,
            dto.questionId,
            dto.answerId,
            dto.timeTaken,
        );

        this.gateway.server.to(clientId).emit('answer_received', result);

        this.gateway.server.to(result.sessionId).emit('player_answered', {
            playerId: result.playerId,
        });

        const players = await this.players.getPlayers(result.sessionId);
        const answers = await this.answers.getAnswersForQuestion(
            result.sessionId,
            dto.questionId,
        );

        if (answers.length === players.length) {
            clearTimeout(this.questionTimers[result.sessionId]);
            delete this.questionTimers[result.sessionId];

            await this.finishQuestion(result.sessionId, dto.questionId);
        }

        return result;
    }


    async finishQuestion(sessionId: string, questionId: string) {
        const stats = await this.answers.getQuestionStats(sessionId, questionId);

        this.gateway.server.to(sessionId).emit('question_results', stats);

        setTimeout(async () => {
            const leaderboard = await this.players.getLeaderboard(sessionId);

            this.gateway.server.to(sessionId).emit('leaderboard', leaderboard);

        }, 3000);
    }


    async nextQuestion(sessionId: string) {
        await this.sessions.increaseQuestionIndex(sessionId);

        const next = await this.sessions.getCurrentQuestion(sessionId);

        if (!next) {
            return this.finishGame(sessionId);
        }

        return this.startQuestion(sessionId);
    }

    async finishGame(sessionId: string) {
        await this.sessions.finish(sessionId);
        await this.reports.generateReport(sessionId);

        this.gateway.server.to(sessionId).emit('game_finished');
    }
}
