import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GamePlayer } from './entities/game-player.entity';
import { GameSession, GameSessionStatus } from '@/game-sessions/entities/game-session.entity';

@Injectable()
export class GamePlayersService {
    constructor(
        @InjectRepository(GamePlayer)
        private readonly playersRepo: Repository<GamePlayer>,

        @InjectRepository(GameSession)
        private readonly sessionsRepo: Repository<GameSession>,
    ) {}

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

    async joinSession(roomCode: string, nickname: string, socketId: string) {
        const session = await this.sessionsRepo.findOne({
            where: { roomCode },
            relations: ['players'],
        });

        if (!session) throw new NotFoundException('Session not found');
        if (session.status !== GameSessionStatus.WAITING)
            throw new BadRequestException('This session is not open for joining');

        // Check duplicates
        const sameName = session.players.find((p) => p.nickname === nickname);
        if (sameName) throw new BadRequestException('Nickname already taken');

        const player = this.playersRepo.create({
            nickname,
            session,
            session_id: session.id,
            socketId,
            totalScore: 0,
        });

        return this.playersRepo.save(player);
    }

    async updateSocket(playerId: string, socketId: string) {
        await this.playersRepo.update(playerId, { socketId });
    }
}
