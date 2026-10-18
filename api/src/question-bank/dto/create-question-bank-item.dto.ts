import { IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateQuestionBankItemDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsString()
    @IsOptional()
    @MaxLength(100)
    topic?: string;

    @IsString() @IsOptional() @MaxLength(100)
    folder?: string;

    @IsArray() @IsOptional() @IsString({ each: true })
    tags?: string[];

    @IsString() @IsOptional() @IsIn(['easy', 'medium', 'hard'])
    difficulty?: string;

    @IsObject()
    payload: Record<string, unknown>;
}
