import jwt from 'jsonwebtoken';
import { parseEnv } from '../src/config/env';
import { hashPassword, verifyPassword } from '../src/utils/password';
import { signToken, verifyToken } from '../src/utils/token';

describe('password (RNF-SEG-02)', () => {
  it('never stores the plain password and verifies the right one', async () => {
    const hash = await hashPassword('any password');

    expect(hash).not.toContain('any password');
    expect(hash).toMatch(/^\$2[aby]\$12\$/);
    await expect(verifyPassword('any password', hash)).resolves.toBe(true);
    await expect(verifyPassword('other password', hash)).resolves.toBe(false);
  });
});

describe('token (RNF-SEG-01)', () => {
  it('keeps the subject on a round trip', () => {
    expect(verifyToken(signToken({ sub: 'abc' }))).toEqual({ sub: 'abc' });
  });

  it('rejects a token signed with another key', () => {
    const forged = jwt.sign({ sub: 'abc' }, 'another-key-with-more-than-thirty-two-chars');

    expect(() => verifyToken(forged)).toThrow();
  });

  it('rejects an unsigned token (alg none)', () => {
    const unsigned = jwt.sign({ sub: 'abc' }, '', { algorithm: 'none' });

    expect(() => verifyToken(unsigned)).toThrow();
  });
});

describe('env (RNF-SEG-05)', () => {
  const valid = {
    CORS_ORIGINS: 'http://a.example, http://b.example',
    DB_HOST: 'db',
    DB_NAME: 'x',
    DB_USER: 'x',
    DB_PASSWORD: 'x',
    JWT_SECRET: 'k'.repeat(32),
  };

  it('splits CORS origins by comma', () => {
    expect(parseEnv(valid).CORS_ORIGINS).toEqual(['http://a.example', 'http://b.example']);
  });

  it('refuses to start with a short JWT_SECRET', () => {
    expect(() => parseEnv({ ...valid, JWT_SECRET: 'short' })).toThrow(/JWT_SECRET/);
  });

  it('refuses to start without database credentials', () => {
    const { DB_USER: _omitted, ...withoutUser } = valid;

    expect(() => parseEnv(withoutUser)).toThrow(/DB_USER/);
  });
});
