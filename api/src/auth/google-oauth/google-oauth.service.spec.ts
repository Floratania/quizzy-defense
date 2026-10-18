import { of } from 'rxjs';
import { GoogleOAuthService } from './google-oauth.service';

describe('Google OAuth', () => {
  const original = { ...process.env };
  afterEach(() => { process.env = { ...original }; });

  it('uses the same callback URL and includes a state value', () => {
    process.env.GOOGLE_CLIENT_ID = 'test-client';
    process.env.GOOGLE_CLIENT_SECRET = 'test-secret';
    process.env.GOOGLE_REDIRECT_URI = 'https://quizzy-api-defense.onrender.com/auth/google/callback';
    const service = new GoogleOAuthService({} as never);
    const url = new URL(service.getAuthUrl('test-state'));
    expect(url.searchParams.get('client_id')).toBe('test-client');
    expect(url.searchParams.get('redirect_uri')).toBe(process.env.GOOGLE_REDIRECT_URI);
    expect(url.searchParams.get('state')).toBe('test-state');
    expect(url.searchParams.get('scope')).toBe('openid profile email');
  });

  it('sends the access token in the userinfo authorization header', async () => {
    const get = jest.fn(() => of({ data: { email: 'teacher@example.test', email_verified: true } }));
    const service = new GoogleOAuthService({ get } as never);
    await service.getUserInfo('test-access-token');
    expect(get).toHaveBeenCalledWith('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: 'Bearer test-access-token' },
    });
  });

  it('rejects an unconfigured provider before redirecting to Google', () => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    const service = new GoogleOAuthService({} as never);
    expect(() => service.getAuthUrl('test-state')).toThrow('Google sign-in is not configured');
  });
});
