import {IsUUID, IsOptional, IsInt, Min, IsObject} from 'class-validator';

export class CreatePlayerAnswerDto {
    @IsUUID()
    questionId: string;

    @IsUUID()
    @IsOptional()
    answerId?: string;

    @IsObject()
    @IsOptional()
    response?: Record<string, unknown>;

    @IsInt()
    @Min(0)
    timeTaken: number; // milliseconds
}
