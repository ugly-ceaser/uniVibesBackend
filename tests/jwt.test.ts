import jwt from 'jsonwebtoken';
import { signJwt, verifyJwt } from '../src/utils/jwt';

jest.mock('../src/config/env', () => ({
  env: { jwtSecret: 'test-only-session-signing-secret' },
}));

describe('session token lifetime', () => {
  it('issues a verifiable token that expires after 180 days (6 months)', () => {
    const token = signJwt({ userId: 'student-1' });
    const payload = verifyJwt(token);
    expect(payload.userId).toBe('student-1');
    expect(payload.exp - payload.iat).toBe(180 * 24 * 60 * 60);
  });

  it('rejects expired tokens', () => {
    const token = signJwt({ userId: 'student-1' }, -1);
    expect(() => verifyJwt(token)).toThrow('Invalid JWT token');
  });

  it('requires legacy sessions without an expiry to log in again', () => {
    const token = jwt.sign({ userId: 'student-1' }, 'test-only-session-signing-secret');
    expect(() => verifyJwt(token)).toThrow('Invalid JWT token');
  });
});
