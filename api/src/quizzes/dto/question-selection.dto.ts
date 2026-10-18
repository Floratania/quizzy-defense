import { IsInt, Min, Max } from 'class-validator';
export class QuestionSelectionDto {
    @IsInt() @Min(0) @Max(1000) easy: number;
    @IsInt() @Min(0) @Max(1000) medium: number;
    @IsInt() @Min(0) @Max(1000) hard: number;
}
