import { Request } from 'express';

export interface TokenClaims {
  id: number;
  email?: string;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user: TokenClaims;
}

export interface OptionalAuthenticatedRequest extends Request {
  user?: TokenClaims;
}

export interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
}

export interface GoogleUserInfo {
  sub: string;
  email: string;
  email_verified: boolean;
  name: string;
  given_name: string;
  family_name: string;
  picture: string;
}
