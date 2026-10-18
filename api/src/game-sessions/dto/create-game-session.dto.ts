// src/game-sessions/dto/create-game-session.dto.ts
import { IsUUID, IsOptional, IsInt, Min, MaxLength, IsEnum, Max, IsArray, IsString, IsIn } from 'class-validator';
import { GameMode } from '../entities/game-session.entity';

export class CreateGameSessionDto {
    @IsUUID()
    quizId: string;

    /** Необов'язково: можна задати власний код (для тестів), інакше генеруємо */
    @IsOptional()
    @MaxLength(12)
    roomCode?: string;

    /** Час між питаннями у секундах (опційно) */
    @IsOptional()
    @IsInt()
    @Min(0)
    interQuestionDelaySec?: number;

    @IsOptional()
    @IsEnum(GameMode)
    mode?: GameMode;

    @IsOptional()
    @IsInt()
    @Min(1)
    @Max(100)
    survivalMistakeLimit?: number;

    @IsOptional()
    @IsInt()
    @Min(2)
    @Max(8)
    teamCount?: number;

    @IsOptional()
    @IsArray()
    @IsString({ each: true })
    teamNames?: string[];

    @IsOptional()
    @IsIn(['AUTO', 'CODES'])
    teamAssignment?: 'AUTO' | 'CODES';

    @IsOptional()
    @IsIn([4, 8])
    tournamentTeamCount?: 4 | 8;
}
