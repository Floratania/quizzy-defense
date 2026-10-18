import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JoinSessionDto } from './dto/join-session.dto';
import {CreatePlayerAnswerDto} from "@/player-answers/dto/create-player-answer.dto";
import {GameFlowService} from "@/game-gateway/game-gateway.service";
import {GamePlayersService} from '@/game-players/game-players.service';

@WebSocketGateway({
    cors: { origin: '*' },
})
export class GameGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly flow: GameFlowService, // ← беремо новий сервіс
        private readonly players: GamePlayersService,
    ) {}

    async handleDisconnect(client: Socket) {
        await this.flow.playerDisconnected(client);
    }

    @SubscribeMessage('host_join_session')
    hostJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { sessionId: string }) {
        return this.flow.hostJoin(client, payload.sessionId);
    }

    @SubscribeMessage('join_session')
    join(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinSessionDto) {
        return this.flow.playerJoin(client, dto);
    }
    @SubscribeMessage('integrity_event')
    async integrity(@ConnectedSocket() client: Socket, @MessageBody() dto?: { hidden?: boolean; reason?: string }) {
        if (typeof dto?.hidden !== 'boolean' || dto.reason === 'blur') return;
        const event = await this.players.recordIntegrityEvent(client.id, dto.hidden);
        if (event) {
            this.server.to(`host:${event.sessionId}`).emit('integrity_updated', event);
            await this.flow.logSessionEvent(event.playerId, 'TAB_HIDDEN');
        }
    }

    @SubscribeMessage('resume_session')
    resume(@ConnectedSocket() client: Socket, @MessageBody() dto: { sessionId: string; playerId: string; resumeToken?: string }) {
        return this.flow.playerResume(client, dto.sessionId, dto.playerId, dto.resumeToken);
    }

    @SubscribeMessage('start_game')
    start(@ConnectedSocket() client: Socket, @MessageBody() dto: { sessionId: string }) {
        return this.flow.startGame(dto.sessionId);
    }

    @SubscribeMessage('submit_answer')
    async submit(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: CreatePlayerAnswerDto
    ) {
        try { return await this.flow.submitAnswer(client.id, dto); }
        catch (error) {
            const message = error instanceof Error ? error.message : 'Не вдалося прийняти відповідь';
            if (message.includes('already answered')) client.emit('answer_received', { submitted: true });
            else client.emit('answer_error', { questionId: dto.questionId, message });
        }
    }

    @SubscribeMessage('next_question')
    next(@MessageBody() dto: { sessionId: string }) {
        return this.flow.nextQuestion(dto.sessionId);
    }
}
