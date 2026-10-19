import { Controller, Post, Body } from '@nestjs/common';
import { IsUUID, IsString, MaxLength } from 'class-validator';
import { JwtService } from '@nestjs/jwt';
import { GamePlayersService } from './game-players.service';

class ResumeStatusDto {
    @IsUUID() sessionId: string;
    @IsUUID() playerId: string;
    @IsString() @MaxLength(2048) resumeToken: string;
}

@Controller('game-players')
export class GamePlayersController {
    constructor(private readonly playersService: GamePlayersService, private readonly jwt: JwtService) {}

    @Post('resume-status')
    async resumeStatus(@Body() dto: ResumeStatusDto) {
        try {
            const claims = this.jwt.verify(dto.resumeToken);
            if (claims.purpose !== 'player-resume' || claims.playerId !== dto.playerId || claims.sessionId !== dto.sessionId) return { resumable: false };
        } catch { return { resumable: false }; }
        return { resumable: await this.playersService.canResume(dto.playerId, dto.sessionId) };
    }
}
