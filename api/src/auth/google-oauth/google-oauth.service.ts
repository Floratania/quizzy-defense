import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { GoogleTokenResponse } from '../types/auth.types';
import { GoogleUserInfo } from '../types/auth.types';

@Injectable()
export class GoogleOAuthService {
  private readonly clientId = process.env.GOOGLE_CLIENT_ID ?? '';
  private readonly clientSecret = process.env.GOOGLE_CLIENT_SECRET ?? '';
  private readonly redirectUri = process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/api/auth/google/callback';

  constructor(private readonly http: HttpService) {}

  async getTokens(code: string): Promise<GoogleTokenResponse> {
    const url = 'https://oauth2.googleapis.com/token';

    const body = new URLSearchParams({
      code,
      client_id: this.clientId,
      client_secret: this.clientSecret,
      redirect_uri: this.redirectUri,
      grant_type: 'authorization_code',
    });

    const response = await firstValueFrom(
      this.http.post<GoogleTokenResponse>(url, body.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    );

    return response.data;
  }

  async getUserInfo(idToken: string, accessToken: string): Promise<GoogleUserInfo> {
    const url = `https://www.googleapis.com/oauth2/v1/userinfo?alt=json&access_token=${accessToken}`;

    const response = await firstValueFrom(
      this.http.get<GoogleUserInfo>(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      }),
    );

    return response.data;
  }

  getAuthUrl(): string {
    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.append('client_id', process.env.GOOGLE_CLIENT_ID ?? '');
    url.searchParams.append(
      'redirect_uri',
      process.env.GOOGLE_REDIRECT_URI ?? 'http://localhost:3000/auth/google/callback',
    );
    url.searchParams.append('response_type', 'code');
    url.searchParams.append('scope', 'openid profile email');
    url.searchParams.append('access_type', 'offline');
    return url.toString();
  }
}
