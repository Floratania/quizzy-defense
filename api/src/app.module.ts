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
import { GameTeamsModule } from './game-teams/game-teams.module';
import { QuestionBankModule } from './question-bank/question-bank.module';
import { LearningClassesModule } from './learning-classes/learning-classes.module';

@Module({
    imports: [
        ConfigModule.forRoot({
            isGlobal: true,
        }),
        TypeOrmModule.forRoot({
            type: 'postgres',
            url: process.env.DATABASE_URL,
            host: process.env.DB_HOST || 'localhost',
            port: Number(process.env.DB_PORT || 5432),
            username: process.env.DB_USERNAME || 'postgres',
            password: process.env.DB_PASSWORD || '1111',
            database: process.env.DB_DATABASE || 'quizzi_db',
            autoLoadEntities: true,
            synchronize: false,
            migrationsRun: true,
            migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
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
        GameTeamsModule,
        QuestionBankModule,
        LearningClassesModule,
    ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
