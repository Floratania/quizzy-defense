import {Type} from 'class-transformer';
import {ValidateNested} from 'class-validator';
// src/game-sessions/dto/create-game-session.dto.ts
import { IsUUID, IsOptional, IsInt, Min, MaxLength, IsEnum, Max, IsArray, IsString, IsIn } from 'class-validator';
import { GameMode } from '../entities/game-session.entity';

class TournamentSelectionDto {
 @IsInt() @Min(0) @Max(1000) easy:number;
 @IsInt() @Min(0) @Max(1000) medium:number;
 @IsInt() @Min(0) @Max(1000) hard:number;
}
class TournamentStageDto {
 @IsOptional() @ValidateNested() @Type(()=>TournamentSelectionDto) selection?:TournamentSelectionDto;
 @IsOptional() @IsInt() @Min(1) @Max(1000) count?:number;
 @IsOptional() @IsIn(['easy','medium','hard']) difficulty?:'easy'|'medium'|'hard';
}
export class CreateGameSessionDto {
 @IsOptional() @IsIn(['AUTO','MANUAL']) tournamentQuestionMode?:'AUTO'|'MANUAL';
 @IsOptional() @IsArray() @ValidateNested({each:true}) @Type(()=>TournamentStageDto) tournamentStagePlan?:TournamentStageDto[];

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
