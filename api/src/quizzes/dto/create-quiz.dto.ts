import {
    IsString,
    IsOptional,
    IsNotEmpty,
    IsUUID,
    IsArray,
    ValidateNested,
    MaxLength,
    IsEnum,
    IsBoolean,
    IsInt,
    Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import {CreateQuestionDto} from "@/questions/dto/create-question.dto";
import {QuizFeedbackMode} from '@/quizzes/entities/quiz.entity';
import { QuestionSelectionDto } from './question-selection.dto';

export class CreateQuizDto {
    @IsOptional()
    @ValidateNested()
    @Type(() => QuestionSelectionDto)
    questionSelection?: QuestionSelectionDto | null;
    @IsString()
    @IsNotEmpty()
    @MaxLength(200)
    title: string;

    @IsString()
    @IsOptional()
    description?: string | null;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    topic?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(0) passThreshold?: number;
    @IsOptional() @IsString() availableFrom?: string;
    @IsOptional() @IsString() availableUntil?: string;
    @IsOptional() @Type(() => Number) @IsInt() @Min(0) maxAttempts?: number;
    @IsOptional() @IsBoolean() requireFullscreen?: boolean;
    @IsOptional() @IsBoolean() trackTabSwitches?: boolean;

    @IsOptional()
    @IsEnum(QuizFeedbackMode)
    feedbackMode?: QuizFeedbackMode;

    @IsOptional()
    @IsBoolean()
    shuffleQuestions?: boolean;

    @IsOptional()
    @IsBoolean()
    shuffleAnswers?: boolean;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateQuestionDto)
    questions: CreateQuestionDto[];
}
