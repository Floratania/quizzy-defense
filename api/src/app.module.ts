import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import {TypeOrmModule} from "@nestjs/typeorm";
import { UsersModule } from './users/users.module';
import { QuizzesModule } from './quizzes/quizzes.module';
import { QuestionsModule } from './questions/questions.module';
import { AnswersModule } from './answers/answers.module';
import { AuthModule } from './auth/auth.module';
import {JwtModule} from "@nestjs/jwt";
import { ConfigModule } from '@nestjs/config';
import { GameSessionsModule } from './game-sessions/game-sessions.module';
import { GamePlayersModule } from './game-players/game-players.module';
import { PlayerAnswersModule } from './player-answers/player-answers.module';
import { GameGatewayModule } from './game-gateway/game-gateway.module';
import { SessionReportsModule } from './session-reports/session-reports.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            host: 'localhost',
            port: 5434,
            username: 'postgres',
            password: '1410',
            database: 'quizzi_db',
            autoLoadEntities: true,
            synchronize: true,
        }),
        JwtModule.register({
            global: true,
            secret: process.env.JWT_SECRET,
        }),
        UsersModule,
        QuizzesModule,
        QuestionsModule,
        AnswersModule,
        AuthModule,
        GameSessionsModule,
        GamePlayersModule,
        PlayerAnswersModule,
        GameGatewayModule,
        SessionReportsModule,
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
