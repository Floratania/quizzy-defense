import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { AuthenticatedRequest, TokenClaims } from '@/auth/types/auth.types';

@Injectable()
export class AuthGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
        const token = this.extractTokenFromHeader(request);

        if (!token) {
            throw new UnauthorizedException('Invalid token');
        }

        try {
            const payload = this.jwtService.verify<TokenClaims>(token);

            const { id, email, name } = payload;
            request.user = { id, email, name };
        } catch {
            throw new UnauthorizedException('Invalid token');
        }

        if (!request.user.id) {
            throw new UnauthorizedException('Invalid token payload');
        }

        return true;
    }

    private extractTokenFromHeader(request: Request): string | undefined {
        if (!request.headers.authorization || !request.headers.authorization?.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        return request.headers.authorization?.split(' ')[1];
    }
}
