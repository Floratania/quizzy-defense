import {Module} from '@nestjs/common';
import {GameSessionsService} from './game-sessions.service';
import {GameSessionsController} from './game-sessions.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {GameSession} from "@/game-sessions/entities/game-session.entity";
import {Quiz} from "@/quizzes/entities/quiz.entity";

@Module({
    imports: [TypeOrmModule.forFeature([GameSession, Quiz])],
    controllers: [GameSessionsController],
    providers: [GameSessionsService],
    exports: [GameSessionsService],
})
export class GameSessionsModule {
}
