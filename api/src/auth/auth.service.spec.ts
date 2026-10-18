import { AuthService } from './auth.service';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    service = new AuthService({ findOne: async () => null } as never, {} as never, {} as never, {} as never, {} as never);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
  it('rejects unknown users', async () => {
    await expect(service.login({email: 'missing@example.test', password: 'invalid'})).rejects.toThrow('User with this email does not exist');
  });
  it('does not return the password hash after signup', async () => {
    const repository = {
      findOne: async () => null,
      create: (user: object) => user,
      save: async (user: object) => ({ ...user, id: 1, role: 'STUDENT' }),
    };
    const auth = new AuthService(repository as never, {} as never, {} as never, {} as never, {} as never);
    const result = await auth.signup({name: 'Test Teacher', email: 'teacher@example.test', password: 'test-password'});
    expect(result).toEqual({id: 1, name: 'Test Teacher', email: 'teacher@example.test', role: 'STUDENT'});
    expect(result.role).toBe('STUDENT');
    expect(result).not.toHaveProperty('password');
  });
  it('rejects an unverified Google email before linking an account', async () => {
    const findUserByEmail = jest.fn();
    const google = {
      getTokens: async () => ({ access_token: 'test-access-token' }),
      getUserInfo: async () => ({ email: 'teacher@example.test', email_verified: false }),
    };
    const auth = new AuthService({} as never, {} as never, {} as never, google as never, { findUserByEmail } as never);
    await expect(auth.loginWithGoogle('test-code')).rejects.toThrow('Google email is not verified');
    expect(findUserByEmail).not.toHaveBeenCalled();
  });
});
