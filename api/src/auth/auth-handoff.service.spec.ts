import { createHash } from 'node:crypto';
import { AuthHandoffService } from './auth-handoff.service';

describe('Browser sign-in handoff', () => {
  const verifier = 'a'.repeat(43);
  const challenge = createHash('sha256').update(verifier).digest('base64url');
  it('requires the initiating browser proof and consumes the code once', () => {
    const service = new AuthHandoffService();
    const code = service.issue('access-token', challenge);
    expect(code).toMatch(/^[a-f0-9]{64}$/);
    expect(() => service.exchange(code, 'b'.repeat(43))).toThrow();
    expect(service.exchange(code, verifier)).toEqual({ accessToken: 'access-token' });
    expect(() => service.exchange(code, verifier)).toThrow();
  });
  it('rejects expired codes and invalid challenges', () => {
    const service = new AuthHandoffService();
    const now = jest.spyOn(Date, 'now').mockReturnValue(1000);
    try {
      expect(() => service.issue('access-token', 'invalid')).toThrow();
      const code = service.issue('access-token', challenge);
      now.mockReturnValue(121001);
      expect(() => service.exchange(code, verifier)).toThrow();
    } finally { now.mockRestore(); }
  });
});
