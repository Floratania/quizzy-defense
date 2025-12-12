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

@WebSocketGateway({
    cors: { origin: '*' },
})
export class GameGateway {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly flow: GameFlowService, // ← беремо новий сервіс
    ) {}

    @SubscribeMessage('host_join_session')
    hostJoin(@ConnectedSocket() client: Socket, @MessageBody() payload: { sessionId: string }) {
        return this.flow.hostJoin(client, payload.sessionId);
    }

    @SubscribeMessage('join_session')
    join(@ConnectedSocket() client: Socket, @MessageBody() dto: JoinSessionDto) {
        return this.flow.playerJoin(client, dto);
    }

    @SubscribeMessage('start_game')
    start(@ConnectedSocket() client: Socket, @MessageBody() dto: { sessionId: string }) {
        return this.flow.startGame(dto.sessionId);
    }

    @SubscribeMessage('submit_answer')
    submit(
        @ConnectedSocket() client: Socket,
        @MessageBody() dto: CreatePlayerAnswerDto
    ) {
        return this.flow.submitAnswer(client.id, dto);
    }

    @SubscribeMessage('next_question')
    next(@MessageBody() dto: { sessionId: string }) {
        return this.flow.nextQuestion(dto.sessionId);
    }
}
