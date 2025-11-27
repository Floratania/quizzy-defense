import { Controller, Post, Body, Get, Param } from '@nestjs/common';
import { GamePlayersService } from './game-players.service';
import { CreateGamePlayerDto } from './dto/create-game-player.dto';

@Controller('game-players')
export class GamePlayersController {
    constructor(private readonly playersService: GamePlayersService) {}

    // @Post()
    // join(@Body() dto: CreateGamePlayerDto) {
    //     return this.playersService.joinSession(dto);
    // }
    //
    // @Get('session/:sessionId')
    // getPlayers(@Param('sessionId') sessionId: string) {
    //     return this.playersService.getPlayersInSession(sessionId);
    // }
}
