import { createHash } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app';
import { RefreshToken, User } from '../src/models';
import { REFRESH_COOKIE, readRefreshCookie } from '../src/utils/refresh-cookie';
import { verifyToken } from '../src/utils/token';

jest.mock('../src/utils/password', () => ({
  hashPassword: jest.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: jest.fn(async (password: string, hash: string) => hash === `hashed:${password}`),
}));

const app = createApp();
const XHR = { 'X-Requested-With': 'fetch' };
const USER_ID = '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10';
const sha256 = (value: string) => createHash('sha256').update(value).digest('hex');

const user = {
  id: USER_ID,
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: null,
  personType: 'individual',
  passwordHash: 'hashed:uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  isStaff: false,
} as unknown as User;

function cookieFrom(response: request.Response): string {
  const header = (response.headers['set-cookie'] as unknown as string[] | undefined)?.find((line) => line.startsWith(`${REFRESH_COOKIE}=`));
  if (!header) throw new Error('no refresh cookie in the response');
  return header;
}

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'row-1',
    userId: USER_ID,
    expiresAt: new Date(Date.now() + 60_000),
    revokedAt: null,
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as RefreshToken;
}

beforeEach(() => {
  jest.spyOn(RefreshToken, 'create').mockResolvedValue({} as RefreshToken);
  jest.spyOn(RefreshToken, 'destroy').mockResolvedValue(0);
});

afterEach(() => jest.restoreAllMocks());

describe('the refresh cookie set by login', () => {
  it('is httpOnly, SameSite, scoped to the auth routes and lives for days', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(user);

    const response = await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'uma-senha-boa' });
    const cookie = cookieFrom(response);

    expect(cookie).toMatch(/HttpOnly/i);
    expect(cookie).toMatch(/SameSite=Lax/i);
    expect(cookie).toMatch(/Path=\/api\/auth(;|$)/);
    expect(cookie).toMatch(/Max-Age=604800/);
  });

  it('is never part of the JSON body, and only its hash is stored', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(user);

    const response = await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'uma-senha-boa' });
    const raw = decodeURIComponent(cookieFrom(response).split(';')[0]!.split('=')[1]!);

    expect(JSON.stringify(response.body)).not.toContain(raw);
    expect(RefreshToken.create).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID, tokenHash: sha256(raw) }));
    expect(JSON.stringify((RefreshToken.create as jest.Mock).mock.calls)).not.toContain(raw);
  });

  it('is not set when the credentials fail', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(null);

    const response = await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'errada-errada' });

    expect(response.status).toBe(401);
    expect(response.headers['set-cookie']).toBeUndefined();
  });
});

describe('POST /api/auth/refresh', () => {
  const withCookie = (value = 'abc') => ({ ...XHR, Cookie: `${REFRESH_COOKIE}=${value}` });

  it('refuses a request that does not carry X-Requested-With, even with a valid cookie', async () => {
    const find = jest.spyOn(RefreshToken, 'findOne');

    const response = await request(app).post('/api/auth/refresh').set('Cookie', `${REFRESH_COOKIE}=abc`);

    expect(response.status).toBe(403);
    expect(find).not.toHaveBeenCalled();
  });

  it('answers 401 without a cookie, and does not touch the database', async () => {
    const find = jest.spyOn(RefreshToken, 'findOne');

    const response = await request(app).post('/api/auth/refresh').set(XHR);

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('session_expired');
    expect(find).not.toHaveBeenCalled();
  });

  it('looks the token up by its hash, never by its value', async () => {
    const find = jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(null);

    await request(app).post('/api/auth/refresh').set(withCookie('valor-bruto'));

    expect(find).toHaveBeenCalledWith({ where: { tokenHash: sha256('valor-bruto') } });
  });

  it('rotates: revokes the used token, sets a new cookie and returns a new access token', async () => {
    const used = row();
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(used);
    jest.spyOn(User, 'findByPk').mockResolvedValue(user);

    const response = await request(app).post('/api/auth/refresh').set(withCookie('abc'));

    expect(response.status).toBe(200);
    expect(verifyToken(response.body.token)).toEqual({ sub: USER_ID });
    expect(response.body.user).toMatchObject({ email: 'ana@exemplo.com', isStaff: false });
    expect(used.update).toHaveBeenCalledWith({ revokedAt: expect.any(Date) });
    expect(cookieFrom(response)).not.toContain('=abc;');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('answers 401 and clears the cookie for an unknown token', async () => {
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(null);

    const response = await request(app).post('/api/auth/refresh').set(withCookie());

    expect(response.status).toBe(401);
    expect(cookieFrom(response)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('answers 401 for an expired token', async () => {
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(row({ expiresAt: new Date(Date.now() - 1000) }));

    expect((await request(app).post('/api/auth/refresh').set(withCookie())).status).toBe(401);
  });

  it('ends every session of the account when a token already rotated is used again after the grace', async () => {
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(row({ revokedAt: new Date(Date.now() - 60_000) }));
    const destroy = jest.spyOn(RefreshToken, 'destroy').mockResolvedValue(2);
    destroy.mockClear();

    const response = await request(app).post('/api/auth/refresh').set(withCookie());

    expect(response.status).toBe(401);
    expect(destroy).toHaveBeenCalledWith({ where: { userId: USER_ID } });
  });

  it('lets a token just rotated through, so two tabs opened together both stay signed in', async () => {
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(row({ revokedAt: new Date(Date.now() - 2000) }));
    jest.spyOn(User, 'findByPk').mockResolvedValue(user);
    const update = jest.spyOn(RefreshToken, 'update');

    const response = await request(app).post('/api/auth/refresh').set(withCookie());

    expect(response.status).toBe(200);
    expect(update).not.toHaveBeenCalled();
  });

  it('answers 401 when the account no longer exists', async () => {
    jest.spyOn(RefreshToken, 'findOne').mockResolvedValue(row());
    jest.spyOn(User, 'findByPk').mockResolvedValue(null);

    expect((await request(app).post('/api/auth/refresh').set(withCookie())).status).toBe(401);
  });
});

describe('POST /api/auth/logout', () => {
  it('deletes the token by hash and clears the cookie', async () => {
    const destroy = jest.spyOn(RefreshToken, 'destroy').mockResolvedValue(1);

    const response = await request(app).post('/api/auth/logout').set(XHR).set('Cookie', `${REFRESH_COOKIE}=abc`);

    expect(response.status).toBe(204);
    expect(destroy).toHaveBeenCalledWith({ where: { tokenHash: sha256('abc') } });
    expect(cookieFrom(response)).toMatch(/Expires=Thu, 01 Jan 1970/);
  });

  it('is 204 even without a session', async () => {
    const destroy = jest.spyOn(RefreshToken, 'destroy');
    destroy.mockClear();

    expect((await request(app).post('/api/auth/logout').set(XHR)).status).toBe(204);
    expect(destroy).not.toHaveBeenCalled();
  });

  it('refuses a request without X-Requested-With', async () => {
    expect((await request(app).post('/api/auth/logout')).status).toBe(403);
  });
});

describe('CORS with credentials', () => {
  it('lets the allowed front-end send the cookie, and no other origin', async () => {
    const allowed = await request(app).options('/api/auth/refresh').set('Origin', 'http://localhost:5173').set('Access-Control-Request-Method', 'POST').set('Access-Control-Request-Headers', 'x-requested-with');
    const other = await request(app).options('/api/auth/refresh').set('Origin', 'https://evil.example').set('Access-Control-Request-Method', 'POST');

    expect(allowed.headers['access-control-allow-credentials']).toBe('true');
    expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');
    expect(other.headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('readRefreshCookie', () => {
  const read = (cookie?: string) => readRefreshCookie({ headers: { cookie } } as never);

  it('finds the cookie among others and decodes it', () => {
    expect(read(`a=1; ${REFRESH_COOKIE}=x%2By; b=2`)).toBe('x+y');
  });

  it('ignores a cookie that only ends with the name, an empty value and a missing header', () => {
    expect(read(`not_${REFRESH_COOKIE}=x`)).toBeNull();
    expect(read(`${REFRESH_COOKIE}=`)).toBeNull();
    expect(read(undefined)).toBeNull();
  });
});
