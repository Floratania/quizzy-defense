import { IsString, IsUUID, Length } from 'class-validator';

export class CreateGamePlayerDto {
    @IsUUID()
    sessionId: string;

    @IsString()
    @Length(1, 30)
    nickname: string;
}
