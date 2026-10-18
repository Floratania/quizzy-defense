import {IsString, IsNotEmpty, IsBoolean, IsUrl, IsOptional} from 'class-validator';

export class CreateAnswerDto {
    @IsString()
    @IsNotEmpty()
    text: string;

    @IsUrl()
    @IsOptional()
    mediaUrl?: string;

    @IsBoolean()
    isCorrect: boolean;
}
