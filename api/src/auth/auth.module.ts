import {AuthHandoffService} from './auth-handoff.service';
import {Module} from '@nestjs/common';
import {AuthService} from './auth.service';
import {AuthController} from './auth.controller';
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@/users/entities/user.entity";
import {RefreshToken} from "@/auth/entities/refresh-token.entity";
import {UsersService} from "@/users/users.service";
import {GoogleOAuthModule} from "@/auth/google-oauth/google-oauth.module";

@Module({
    imports: [TypeOrmModule.forFeature([User, RefreshToken]), GoogleOAuthModule],
    controllers: [AuthController],
    providers: [AuthHandoffService, AuthService, UsersService],
})
export class AuthModule {
}
