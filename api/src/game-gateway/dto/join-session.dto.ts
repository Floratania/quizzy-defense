import { IsString, Length } from 'class-validator';

export class JoinSessionDto {
    @IsString()
    @Length(4, 12)
    roomCode: string;

    @IsString()
    @Length(1, 30)
    nickname: string;
}
