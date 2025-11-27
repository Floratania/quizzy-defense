import {IsUUID, IsOptional, IsInt, Min} from 'class-validator';

export class CreatePlayerAnswerDto {
    @IsUUID()
    questionId: string;

    @IsUUID()
    @IsOptional()
    answerId: string;

    @IsInt()
    @Min(0)
    timeTaken: number; // milliseconds
}
