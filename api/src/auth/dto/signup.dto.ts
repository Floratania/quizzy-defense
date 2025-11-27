import {IsEmail, IsNotEmpty, IsString, MinLength} from "class-validator";

export class SignupDto {
    @IsNotEmpty({message: 'Email should not be empty'})
    @IsEmail({}, {message: 'Invalid email format'})
    email: string;

    @IsString({message: 'Name should be string'})
    @MinLength(6, {message: 'Name should be at least 6 characters'})
    name: string;

    @IsNotEmpty({message: 'Password should not be empty'})
    @IsString({message: 'Password should be string'})
    @MinLength(8, {message: 'Password should be at least 8 characters long'})
    password: string;
}