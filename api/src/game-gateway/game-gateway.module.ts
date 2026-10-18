import { Module } from '@nestjs/common';
import { GameGateway } from './game.gateway';
import { GamePlayersModule } from '@/game-players/game-players.module';
import { GameSessionsModule } from '@/game-sessions/game-sessions.module';
import {PlayerAnswersModule} from "@/player-answers/player-answers.module";
import {SessionReportsModule} from "@/session-reports/session-reports.module";
import {GameFlowService} from "@/game-gateway/game-gateway.service";
import {GameTeamsModule} from "@/game-teams/game-teams.module";

@Module({
    imports: [GamePlayersModule, GameSessionsModule, PlayerAnswersModule, SessionReportsModule, GameTeamsModule],
    providers: [GameGateway, GameFlowService],
})
export class GameGatewayModule {}
