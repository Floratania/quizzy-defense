import { AuthController } from './auth.controller';
import type { Request, Response } from 'express';

describe('Google OAuth callback', () => {
  it('rejects a mismatched state without exchanging the authorization code', async () => {
    const loginWithGoogle = jest.fn();
    const controller = new AuthController({ loginWithGoogle } as never, {} as never, {} as never, {} as never);
    const req = { cookies: { googleOAuthState: 'a'.repeat(64) } } as Request;
    const res = { clearCookie: jest.fn() } as unknown as Response;
    await expect(controller.googleCallback('test-code', 'b'.repeat(64), req, res)).rejects.toThrow('Invalid Google OAuth state');
    expect(loginWithGoogle).not.toHaveBeenCalled();
  });

  it('rejects non-ASCII state values without a buffer comparison error', async () => {
    const controller = new AuthController({} as never, {} as never, {} as never, {} as never);
    const req = { cookies: { googleOAuthState: 'a'.repeat(64) } } as Request;
    const res = { clearCookie: jest.fn() } as unknown as Response;
    await expect(controller.googleCallback('test-code', 'ї'.repeat(64), req, res)).rejects.toThrow('Invalid Google OAuth state');
  });

  it('accepts the state cookie, creates the session, and redirects to the UI', async () => {
    const loginWithGoogle = jest.fn(async () => ({ accessToken: 'test-access', refreshToken: 'test-refresh' }));
    const controller = new AuthController({ loginWithGoogle } as never, {} as never, {} as never, {} as never);
    const req = { cookies: { googleOAuthState: 'a'.repeat(64) } } as Request;
    const res = { clearCookie: jest.fn(), cookie: jest.fn(), redirect: jest.fn() } as unknown as Response;
    await controller.googleCallback('test-code', 'a'.repeat(64), req, res);
    expect(loginWithGoogle).toHaveBeenCalledWith('test-code');
    expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'test-refresh', expect.objectContaining({ httpOnly: true }));
    expect(res.redirect).toHaveBeenCalledWith(process.env.FRONTEND_URL || 'http://localhost:5173');
  });
});
