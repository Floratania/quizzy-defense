import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsUUID,
    IsArray,
    ValidateNested,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import {CreateQuestionDto} from "@/questions/dto/create-question.dto";

export class CreateQuizDto {
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    description?: string | null;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
