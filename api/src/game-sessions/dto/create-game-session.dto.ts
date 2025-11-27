// src/game-sessions/dto/create-game-session.dto.ts
import { IsUUID, IsOptional, IsInt, Min, MaxLength } from 'class-validator';

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
}
