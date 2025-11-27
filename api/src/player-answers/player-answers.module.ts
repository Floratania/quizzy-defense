import {Module} from '@nestjs/common';
import {PlayerAnswersService} from './player-answers.service';
import {PlayerAnswersController} from './player-answers.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {PlayerAnswer} from "@/player-answers/entities/player-answer.entity";
import {Question} from "@/questions/entities/question.entity";
import {Answer} from "@/answers/entities/answer.entity";
import {GamePlayer} from "@/game-players/entities/game-player.entity";

@Module({
    imports: [TypeOrmModule.forFeature([PlayerAnswer, Question, Answer, GamePlayer])],
    controllers: [PlayerAnswersController],
    providers: [PlayerAnswersService],
    exports: [PlayerAnswersService],
})
export class PlayerAnswersModule {
}
