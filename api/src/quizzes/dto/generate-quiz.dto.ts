import { Type } from 'class-transformer';
import { IsInt, IsObject, IsOptional, IsString, Max, MaxLength, Min, MinLength } from 'class-validator';

export class GenerateQuizDto {
    @IsString()
    @MinLength(50)
    @MaxLength(15000)
    sourceText: string;

    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(3)
    @Max(20)
    questionCount?: number;

    @IsOptional()
    @IsObject()
    typeCounts?: Record<string, number>;

    @IsOptional()
    @IsString()
    @MaxLength(50)
    language?: string;
}
