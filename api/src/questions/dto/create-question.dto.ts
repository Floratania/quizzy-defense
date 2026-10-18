import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    IsUrl,
    IsArray,
    ValidateNested, IsEnum, IsObject, MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {CreateAnswerDto} from "@/answers/dto/create-answer.dto";
import {QuestionType} from "@/questions/entities/question.entity";

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsOptional()
    @IsString()
    @MaxLength(10000)
    explanation?: string;

    @IsInt()
    @Min(1)
    timeLimit: number;

    @IsInt()
    @Min(0)
    points: number;

    @IsUrl()
    @IsOptional()
    mediaUrl?: string;

    @IsEnum(QuestionType)
    type: QuestionType;

    @IsObject()
    @IsOptional()
    configuration?: Record<string, unknown> | null;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnswerDto)
    answers: CreateAnswerDto[];
}
