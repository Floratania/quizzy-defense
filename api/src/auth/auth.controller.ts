import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Post,
    Req,
    Res,
    UnauthorizedException, UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import type { Request, Response } from 'express';
import * as authTypes from "@/auth/types/auth.types";
import {AuthGuard} from "@/guards/auth.guard";
import * as authTypes_1 from "@/auth/types/auth.types";
import {UsersService} from "@/users/users.service";

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
    ) {
    }

    @Post('signup')
    async signup(@Body() signupData: SignupDto) {
        return this.authService.signup(signupData);
    }

    @Post('login')
    @HttpCode(200)
    async login(@Body() loginData: LoginDto, @Res({passthrough: true}) res: Response) {
        const {refreshToken, accessToken, user} = await this.authService.login(loginData);

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return {accessToken, user};
    }

    @Post('logout')
    @HttpCode(200)
    async logout(@Req() req: authTypes.AuthenticatedRequest, @Res({passthrough: true}) res: Response) {
        const refreshToken = req.cookies['refreshToken'] as string | undefined;

        if (!refreshToken) {
            throw new BadRequestException('No refresh token found');
        }

        await this.authService.invalidateRefreshToken(refreshToken);

        res.clearCookie('refreshToken', {
            httpOnly: true,
            sameSite: 'strict',
            path: '/',
        });
    }

    @Get('refresh')
    async refreshTokens(@Req() req: Request, @Res({passthrough: true}) res: Response) {
        const oldRefreshToken = req.cookies['refreshToken'] as string | undefined;

        if (!oldRefreshToken) {
            throw new UnauthorizedException('Refresh token not found');
        }

        const {refreshToken: newRefreshToken, accessToken: newAccessToken} =
            await this.authService.refreshJwtTokens(oldRefreshToken);

        res.cookie('refreshToken', newRefreshToken, {
            httpOnly: true,
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        });

        return {accessToken: newAccessToken};
    }

    @UseGuards(AuthGuard)
    @Get('me')
    async getMe(@Req() req: authTypes_1.AuthenticatedRequest) {
        const user = await this.usersService.findOne(req.user.id);

        if (!user) {
            throw new UnauthorizedException('User not found');
        }

        return {
            id: user.id,
            email: user.email,
            name: user.name,
        };
    }

    // @Get('google')
    // googleLogin(@Res() res: Response) {
    //     const url = this.googleOAuthService.getAuthUrl();
    //     return res.redirect(url);
    // }
    //
    // @Get('google/callback')
    // async googleCallback(@Query('code') code: string, @Res({ passthrough: true }) res: Response) {
    //     if (!code) throw new UnauthorizedException('No code provided');
    //
    //     const { accessToken, refreshToken } = await this.authService.loginWithGoogle(code);
    //
    //     res.cookie('refreshToken', refreshToken, {
    //         httpOnly: true,
    //         sameSite: 'strict',
    //         maxAge: 30 * 24 * 60 * 60 * 1000,
    //     });
    //
    //     res.cookie('accessToken', accessToken, {
    //         httpOnly: true,
    //         sameSite: 'strict',
    //         maxAge: 15 * 60 * 1000,
    //     });
    //
    //     return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    // }
    //

}
