import {Transform} from 'class-transformer';
import {IsInt, IsNotEmpty, IsOptional, IsString, MaxLength, Min} from 'class-validator';

export class CreateQuestionBankFolderDto {
    @Transform(({value}) => typeof value === 'string' ? value.trim() : value)
    @IsString() @IsNotEmpty() @MaxLength(100)
    name: string;

    @IsOptional() @IsInt() @Min(1)
    ownerId?: number;
}
