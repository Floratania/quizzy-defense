import { IsEmail, IsIn, MaxLength } from 'class-validator';

export class ShareQuizDto {
    @IsEmail()
    @MaxLength(254)
    email: string;

    @IsIn(['VIEWER', 'EDITOR'])
    role: 'VIEWER' | 'EDITOR';
}
