import {validate} from 'class-validator';
import {SignupDto} from './dto/signup.dto';
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
  it('rejects registration without explicit consent before accessing user storage', async () => {
    await expect(service.signup({name:'Test User',email:'test@example.test',password:'password123',personalDataConsent:false})).rejects.toThrow('Потрібна згода');
  });
  it.each([undefined,false,'true',1])('rejects an invalid consent value %s in the signup DTO', async consent => {
    const dto=Object.assign(new SignupDto(),{name:'Test User',email:'test@example.test',password:'password123',personalDataConsent:consent});
    expect((await validate(dto)).some(e=>e.property==='personalDataConsent')).toBe(true);
  });
  it('does not return the password hash after signup', async () => {
    const repository = {
      findOne: async () => null,
      create: jest.fn((user: object) => user),
      save: async (user: object) => ({ ...user, id: 1, role: 'STUDENT' }),
    };
    const auth = new AuthService(repository as never, {} as never, {} as never, {} as never, {} as never);
    const result = await auth.signup({personalDataConsent:true, name: 'Test Teacher', email: 'teacher@example.test', password: 'test-password'});
    expect(result).toEqual({id: 1, name: 'Test Teacher', email: 'teacher@example.test', role: 'STUDENT'});
    expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({personalDataConsentAt:expect.any(Date)}));
    expect(result.role).toBe('STUDENT');
    expect(result).not.toHaveProperty('password');
  });
  it('does not create a Google account without consent', async () => {
    const repository={create:jest.fn()};
    const google={getTokens:async()=>({access_token:'test'}),getUserInfo:async()=>({email:'new@example.test',email_verified:true,name:'New User'})};
    const auth=new AuthService(repository as never,{} as never,{} as never,google as never,{findUserByEmail:async()=>null} as never);
    await expect(auth.loginWithGoogle('code')).rejects.toThrow('PERSONAL_DATA_CONSENT_REQUIRED');
    expect(repository.create).not.toHaveBeenCalled();
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
  it.each([
    ['tania.flyora@gmail.com', 'ADMIN'],
    ['Tania.Flyora@gmail.com', 'ADMIN'],
    ['student@example.test', 'STUDENT'],
    ['tania.flyora@gmail.com.attacker.test', 'STUDENT'],
  ])('assigns the expected role to new accounts for %s', async (email, role) => {
    const repository = {
      findOne: async () => null,
      create: (user: object) => user,
      save: async (user: object) => ({ ...user, id: 1 }),
    };
    const auth = new AuthService(repository as never, {} as never, {} as never, {} as never, {} as never);
    const registered = await auth.signup({ name: 'User', email, password: 'test-password', personalDataConsent: true });
    expect(registered.role).toBe(role);
    const googleUser = await auth.createGoogleUser({ name: 'User', email });
    expect(googleUser.role).toBe(role);
  });
});
