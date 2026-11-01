import {AuthHandoffService} from './auth-handoff.service';
import {Matches} from 'class-validator';
class ExchangeDto { @Matches(/^[a-f0-9]{64}$/) code:string; @Matches(/^[A-Za-z0-9_-]{43,128}$/) verifier:string; }
import {
    BadRequestException,
    Body,
    Controller,
    Get,
    HttpCode,
    Post, Query,
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
import {GoogleOAuthService} from "@/auth/google-oauth/google-oauth.service";
import {randomBytes, timingSafeEqual} from 'node:crypto';

class BrowserLoginDto extends LoginDto { @Matches(/^[A-Za-z0-9_-]{43}$/) challenge:string; }

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly usersService: UsersService,
        private readonly googleOAuthService: GoogleOAuthService,
        private readonly handoff: AuthHandoffService,
    ) {
    }

    private frontend(path:string){return `${(process.env.FRONTEND_URL||'http://localhost:5173').replace(/\/$/,'')}${path}`;}
    private refreshCookie(res:Response,token:string){res.cookie('refreshToken',token,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'lax',path:'/',maxAge:30*24*60*60*1000});}
    @Post('browser-login')
    async browserLogin(@Body()dto:BrowserLoginDto,@Res()res:Response){
        res.setHeader('Cache-Control','no-store');
        try{const tokens=await this.authService.login(dto);this.refreshCookie(res,tokens.refreshToken);const code=this.handoff.issue(tokens.accessToken,dto.challenge);return res.redirect(303,this.frontend(`/auth/complete?code=${code}`));}
        catch{return res.redirect(303,this.frontend('/auth?loginError=credentials'));}
    }
    @Get('restore')
    async restore(@Query('challenge')challenge:string,@Req()req:Request,@Res()res:Response){
        res.setHeader('Cache-Control','no-store');
        try{const token=req.cookies?.refreshToken;if(!token)throw new UnauthorizedException();const tokens=await this.authService.refreshJwtTokens(token);this.refreshCookie(res,tokens.refreshToken);const code=this.handoff.issue(tokens.accessToken,challenge);return res.redirect(this.frontend(`/auth/complete?code=${code}`));}
        catch{return res.redirect(this.frontend('/auth/complete?error=session_expired'));}
    }
    @Post('exchange') @HttpCode(200)
    exchange(@Body()dto:ExchangeDto,@Res({passthrough:true})res:Response){res.setHeader('Cache-Control','no-store');return this.handoff.exchange(dto.code,dto.verifier);}
    @Post('browser-logout')
    async browserLogout(@Req()req:Request,@Res()res:Response){
        if(req.headers.origin!==new URL(process.env.FRONTEND_URL||'http://localhost:5173').origin)throw new UnauthorizedException('Invalid logout origin');
        if(req.cookies?.refreshToken)await this.authService.invalidateRefreshToken(req.cookies.refreshToken);
        res.clearCookie('refreshToken',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.NODE_ENV==='production'?'none':'lax',path:'/'});
        res.clearCookie('accessToken',{path:'/'});return res.redirect(303,this.frontend('/auth'));
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
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
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
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
            name: user.name, role: user.role, teacherRequested: user.teacherRequested,
        };
    }

    @Get('google')
    googleLogin(@Res() res: Response, @Query('challenge') challenge?:string, @Query('personalDataConsent') personalDataConsent?:string) {
        const state = randomBytes(32).toString('hex');
        const url = this.googleOAuthService.getAuthUrl(state);
        res.cookie('googleOAuthState', state, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/auth/google/callback',
            maxAge: 10 * 60 * 1000,
        });
        res.cookie('googleDataConsent', personalDataConsent === 'true' ? state : '', {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/auth/google/callback',maxAge:600000});
        if(challenge){if(!/^[A-Za-z0-9_-]{43}$/.test(challenge))throw new UnauthorizedException('Invalid browser challenge');res.cookie('googleOAuthChallenge',challenge,{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/auth/google/callback',maxAge:600000});}
        return res.redirect(url);
    }

    @Get('google/callback')
    async googleCallback(@Query('code') code: string, @Query('state') state: string, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
        const expectedState = req.cookies?.googleOAuthState;
        res.clearCookie('googleOAuthState', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/auth/google/callback' });
        if (typeof state !== 'string' || typeof expectedState !== 'string'
            || !/^[a-f0-9]{64}$/.test(state) || !/^[a-f0-9]{64}$/.test(expectedState)
            || !timingSafeEqual(Buffer.from(state), Buffer.from(expectedState))) {
            throw new UnauthorizedException('Invalid Google OAuth state');
        }
        if (!code) throw new UnauthorizedException('No code provided');

        const consent = req.cookies?.googleDataConsent === state;
        res.clearCookie('googleDataConsent',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/auth/google/callback'});
        let tokens;
        try { tokens = await this.authService.loginWithGoogle(code, consent); }
        catch(error) {
            if(error instanceof Error && error.message === 'PERSONAL_DATA_CONSENT_REQUIRED') return res.redirect(this.frontend('/auth?consentRequired=1'));
            throw error;
        }
        const { accessToken, refreshToken } = tokens;

        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 30 * 24 * 60 * 60 * 1000,
        });

        res.cookie('accessToken', accessToken, {
            httpOnly: true,
            sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
            secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000,
        });

        const challenge=req.cookies?.googleOAuthChallenge;
        res.clearCookie('googleOAuthChallenge',{httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:'lax',path:'/auth/google/callback'});
        if(challenge){const code=this.handoff.issue(accessToken,challenge);return res.redirect(this.frontend(`/auth/complete?code=${code}`));}
        return res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
    }


}
