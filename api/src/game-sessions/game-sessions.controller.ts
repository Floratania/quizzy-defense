import {
    Controller,
    Post,
    Body,
    Param,
    Get,
} from '@nestjs/common';
import { GameSessionsService } from './game-sessions.service';
import { CreateGameSessionDto } from './dto/create-game-session.dto';

@Controller('game-sessions')
export class GameSessionsController {
    constructor(private readonly service: GameSessionsService) {}

    @Post()
    create(@Body() dto: CreateGameSessionDto) {
        return this.service.create(dto);
    }

    @Post(':id/start')
    start(@Param('id') id: string) {
        return this.service.start(id);
    }

    @Post(':id/finish')
    finish(@Param('id') id: string) {
        return this.service.finish(id);
    }

    @Get(':id')
    getById(@Param('id') id: string) {
        return this.service.getById(id);
    }

    @Get('by-code/:roomCode')
    getByRoomCode(@Param('roomCode') code: string) {
        return this.service.getByRoomCode(code);
    }
}
