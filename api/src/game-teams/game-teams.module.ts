import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SessionTeam } from './entities/session-team.entity';
import { GameTeamsService } from './game-teams.service';
import { GameSession } from '../game-sessions/entities/game-session.entity';

@Module({
    imports: [TypeOrmModule.forFeature([SessionTeam, GameSession])],
    providers: [GameTeamsService],
    exports: [GameTeamsService],
})
export class GameTeamsModule {}
