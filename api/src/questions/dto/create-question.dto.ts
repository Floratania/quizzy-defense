import {
    IsString,
    IsNotEmpty,
    IsOptional,
    IsInt,
    Min,
    IsUrl,
    IsArray,
    ValidateNested, IsEnum,
} from 'class-validator';
import { Type } from 'class-transformer';
import {CreateAnswerDto} from "@/answers/dto/create-answer.dto";
import {QuestionType} from "@/questions/entities/question.entity";

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    text: string;

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

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateAnswerDto)
    answers: CreateAnswerDto[];
}
