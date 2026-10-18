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
});
