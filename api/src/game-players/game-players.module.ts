import {Module} from '@nestjs/common';
import {GamePlayersService} from './game-players.service';
import {GamePlayersController} from './game-players.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {GameSession} from "@/game-sessions/entities/game-session.entity";

@Module({
    imports: [TypeOrmModule.forFeature([GamePlayer, GameSession])],
    controllers: [GamePlayersController],
    providers: [GamePlayersService],
    exports: [GamePlayersService],
})
export class GamePlayersModule {
}
