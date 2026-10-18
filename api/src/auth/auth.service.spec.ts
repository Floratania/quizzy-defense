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
      save: async (user: object) => ({ ...user, id: 1, role: 'TEACHER' }),
    };
    const auth = new AuthService(repository as never, {} as never, {} as never, {} as never, {} as never);
    const result = await auth.signup({name: 'Test Teacher', email: 'teacher@example.test', password: 'test-password'});
    expect(result).toEqual({id: 1, name: 'Test Teacher', email: 'teacher@example.test', role: 'TEACHER'});
    expect(result).not.toHaveProperty('password');
  });
});
