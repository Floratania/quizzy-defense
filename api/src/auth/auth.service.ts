import {BadRequestException, Injectable, NotFoundException, UnauthorizedException} from '@nestjs/common';
import {SignupDto} from './dto/signup.dto';
import {InjectRepository} from '@nestjs/typeorm';
import {MoreThanOrEqual, Repository} from 'typeorm';
import * as bcrypt from 'bcrypt';
import {LoginDto} from './dto/login.dto';
import {JwtService} from '@nestjs/jwt';
import {RefreshToken} from './entities/refresh-token.entity';
import {v4 as uuidv4} from 'uuid';
import {User} from '@/users/entities/user.entity';
import {TokenClaims} from './types/auth.types';
import {GoogleOAuthService} from "@/auth/google-oauth/google-oauth.service";
import {UsersService} from "@/users/users.service";

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private readonly userRepository: Repository<User>,
        @InjectRepository(RefreshToken)
        private readonly refreshTokenRepository: Repository<RefreshToken>,
        private readonly jwtService: JwtService,
        private readonly googleOAuthService: GoogleOAuthService,
        private readonly userService: UsersService,
    ) {
    }

    async signup(signupData: SignupDto) {
        const {name, email, password} = signupData;
        const existingUser = await this.userRepository.findOne({
            where: {email},
            withDeleted: true,
        });

        if (existingUser) {
            throw new BadRequestException('Email already in use');
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = this.userRepository.create({
            name,
            email,
            password: hashedPassword,
        });

        return this.userRepository.save(newUser);
    }

    async login(loginData: LoginDto) {
        const {email, password} = loginData;

        const existingUser = await this.userRepository.findOne({
            where: {
                email,
            },
        });

        if (!existingUser) {
            throw new UnauthorizedException('User with this email does not exist');
        }

        if (!existingUser.password) {
            throw new UnauthorizedException('This account uses Google sign-in. Please continue with Google.');
        }

        const passwordMatch = await bcrypt.compare(password, existingUser.password);

        if (!passwordMatch) {
            throw new UnauthorizedException('Incorrect password');
        }

        const claims: TokenClaims = {
            id: existingUser.id,
            email: existingUser.email,
            name: existingUser.name,
        };

        const tokens = await this.generateJwtTokens(claims);

        return {
            ...tokens,
            user: {
                ...claims
            },
        };
    }

    async refreshJwtTokens(refreshToken: string) {
        const token = await this.refreshTokenRepository.findOne({
            where: {
                token: refreshToken,
                expiresAt: MoreThanOrEqual(new Date()),
            },
            relations: ['user'],
        });

        if (!token || !token.user) {
            throw new UnauthorizedException('Invalid refresh token or user not found');
        }


        const claims: TokenClaims = {
            id: token.user.id,
            email: token.user.email,
            name: token.user.name,
        };

        return this.generateJwtTokens(claims);
    }

    async generateJwtTokens(claims: TokenClaims, expiresIn: `${number}${"s" | "m" | "h" | "d"}` = '15m') {
        const accessToken = this.jwtService.sign(claims, {expiresIn});
        const refreshToken = uuidv4();

        await this.storeRefreshToken(refreshToken, claims.id);

        return {accessToken, refreshToken};
    }

    private async storeRefreshToken(token: string, userId: number) {
        const expiryDate = new Date();
        expiryDate.setMonth(expiryDate.getMonth() + 1);

        let refreshToken = await this.refreshTokenRepository.findOne({
            where: {user: {id: userId}},
        });

        if (refreshToken) {
            refreshToken.token = token;
            refreshToken.expiresAt = expiryDate;
        } else {
            refreshToken = this.refreshTokenRepository.create({
                token,
                user: {id: userId},
                expiresAt: expiryDate,
            });
        }

        return this.refreshTokenRepository.save(refreshToken);
    }

    async invalidateRefreshToken(token: string) {
        await this.refreshTokenRepository.delete({token});
    }

    async createGoogleUser(data: { name: string; email: string }): Promise<User> {
        const newUser = this.userRepository.create({
            name: data.name,
            email: data.email,
            password: '',
        });

        return this.userRepository.save(newUser);
    }

    async loginWithGoogle(code: string) {
        const tokens = await this.googleOAuthService.getTokens(code);
        const profile = await this.googleOAuthService.getUserInfo(tokens.id_token, tokens.access_token);

        let user = await this.userService.findUserByEmail(profile.email);
        if (!user) {
            user = await this.createGoogleUser({
                name: profile.name,
                email: profile.email
            });
        } else {
            user.name = profile.name
            await this.updateUser(user);
        }

        const claims: TokenClaims = {
            id: user.id,
            email: user.email,
            name: user.name,
        };

        return this.generateJwtTokens(claims);
    }

    async updateUser(user: User): Promise<User> {
        return this.userRepository.save(user);
    }
    // async forgotPassword(email: string): Promise<{ message: string }> {
    //     const user = await this.userService.findUserByEmail(email);
    //
    //     if (!user || !user.email || !user.name) {
    //         throw new BadRequestException('User with this email or name does not exist');
    //     }
    //
    //     const token = await this.generateResetToken(user.id);
    //     await this.sendGridService.sendResetEmail(user.email, user.name, token.token);
    //     return { message: 'A reset link has been sent to your email.' };
    // }
    //
    // async generateResetToken(userId: number): Promise<ResetToken> {
    //     const token = uuidv4();
    //     const expiryDate = new Date();
    //     expiryDate.setHours(expiryDate.getHours() + 1);
    //
    //     let resetToken = await this.resetTokenRepository.findOne({
    //         where: { user: { id: userId } },
    //     });
    //
    //     if (resetToken) {
    //         resetToken.token = token;
    //         resetToken.expiresAt = expiryDate;
    //     } else {
    //         resetToken = this.resetTokenRepository.create({
    //             token,
    //             user: { id: userId },
    //             expiresAt: expiryDate,
    //         });
    //     }
    //
    //     return this.resetTokenRepository.save(resetToken);
    // }
    //
    // async resetPassword(dto: ResetPasswordDto): Promise<void> {
    //     const { token, newPassword } = dto;
    //
    //     const userId = await this.verifyResetToken(token);
    //     if (!userId) {
    //         throw new UnauthorizedException('Invalid or expired token');
    //     }
    //
    //     await this.updateUserPassword(userId, newPassword);
    //
    //     await this.resetTokenRepository.delete({ token });
    // }
    //
    // async verifyResetToken(token: string): Promise<number | null> {
    //     const resetToken = await this.resetTokenRepository.findOne({
    //         where: { token },
    //         relations: ['user'],
    //     });
    //
    //     if (!resetToken) return null;
    //     if (resetToken.expiresAt < new Date()) {
    //         await this.resetTokenRepository.delete({ token });
    //         return null;
    //     }
    //
    //     return resetToken.user.id;
    // }
    //
    // async updateUserPassword(userId: number, newPassword: string): Promise<void> {
    //     const user = await this.userRepository.findOne({ where: { id: userId } });
    //     if (!user) {
    //         throw new NotFoundException('User not found');
    //     }
    //
    //     user.password = await bcrypt.hash(newPassword, 10);
    //
    //     await this.userRepository.save(user);
    // }
}
