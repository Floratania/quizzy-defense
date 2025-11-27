import {Module} from '@nestjs/common';
import {SessionReportsService} from './session-reports.service';
import {SessionReportsController} from './session-reports.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {SessionReport} from "@/session-reports/entities/session-report.entity";
import {PlayerAnswer} from "@/player-answers/entities/player-answer.entity";
import {Question} from "@/questions/entities/question.entity";
import {GamePlayer} from "@/game-players/entities/game-player.entity";
import {Answer} from "@/answers/entities/answer.entity";
import {GameSession} from "@/game-sessions/entities/game-session.entity";

@Module({
    imports: [TypeOrmModule.forFeature([SessionReport, PlayerAnswer, Question, Answer, GamePlayer, GameSession])],
    controllers: [SessionReportsController],
    providers: [SessionReportsService],
    exports: [SessionReportsService],
})
export class SessionReportsModule {
}
