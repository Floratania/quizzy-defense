import {
    Controller,
    Post,
    Body,
    Param,
    Get, UseGuards, Req,
} from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { CreateGameSessionDto } from './dto/create-game-session.dto';
import {AuthGuard} from "@/guards/auth.guard";
import * as authTypes from "@/auth/types/auth.types";

@Controller('game-sessions')
export class GameSessionsController {
    constructor(private readonly service: GameSessionsService) {}

    @UseGuards(AuthGuard)
    @Post()
    create(@Body() dto: CreateGameSessionDto, @Req() req: authTypes.AuthenticatedRequest) {
        return this.service.create(dto, req.user.id);
    }

    @UseGuards(AuthGuard)
    @Get('my/active')
    getMyActive(@Req() req: authTypes.AuthenticatedRequest) {
        return this.service.getHostActiveSessions(req.user.id);
    }

    @UseGuards(AuthGuard)
    @Post(':id/start')
    start(@Param('id') id: string) {
        return this.service.start(id);
    }

    @UseGuards(AuthGuard)
    @Post(':id/finish')
    finish(@Param('id') id: string, @Req() req: authTypes.AuthenticatedRequest) {
        return this.service.finishForHost(id, req.user.id);
    }

    @Get('by-code/:roomCode')
    getByRoomCode(@Param('roomCode') code: string) {
        return this.service.getByRoomCode(code);
    }


    @Get(':id')
    getById(@Param('id') id: string) {
        return this.service.getById(id);
    }
}
