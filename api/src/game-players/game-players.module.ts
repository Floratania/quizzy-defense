import {Module} from '@nestjs/common';
import {GamePlayersService} from './game-players.service';
import {GamePlayersController} from './game-players.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {GameSession} from "@/game-sessions/entities/game-session.entity";
import {SessionTeam} from "@/game-teams/entities/session-team.entity";
import { SessionEvent } from './entities/session-event.entity';

@Module({
    imports: [TypeOrmModule.forFeature([GamePlayer, GameSession, SessionTeam, SessionEvent])],
    controllers: [GamePlayersController],
    providers: [GamePlayersService],
    exports: [GamePlayersService],
})
export class GamePlayersModule {
}
