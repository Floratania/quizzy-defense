import { IsInt, IsOptional, IsString, IsUUID, Length } from 'class-validator';

export class JoinSessionDto {
    @IsString()
    @Length(4, 12)
    roomCode: string;

    @IsString()
    @Length(1, 30)
    nickname: string;

    @IsOptional()
    @IsUUID()
    teamId?: string;

    @IsOptional() @IsInt()
    studentId?: number;
}
