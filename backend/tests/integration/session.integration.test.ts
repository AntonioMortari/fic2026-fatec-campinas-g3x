import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { RefreshToken, sequelize, User } from '../../src/models';
import { REFRESH_COOKIE } from '../../src/utils/refresh-cookie';
import { verifyToken } from '../../src/utils/token';

const app = createApp();
const XHR = { 'X-Requested-With': 'fetch' };

const VALID = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: null,
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
};

function cookieOf(response: request.Response): string {
  const lines = response.headers['set-cookie'] as unknown as string[] | undefined;
  const line = lines?.find((entry) => entry.startsWith(`${REFRESH_COOKIE}=`));
  if (!line) throw new Error('no refresh cookie');
  return line.split(';')[0]!;
}

async function backdateRevocations() {
  const rows = await RefreshToken.findAll();
  await Promise.all(rows.filter((row) => row.revokedAt).map((row) => row.update({ revokedAt: new Date(Date.now() - 60_000) })));
}

const refresh = (cookie: string) => request(app).post('/api/auth/refresh').set(XHR).set('Cookie', cookie);

async function signUp(overrides: Record<string, unknown> = {}) {
  const response = await request(app).post('/api/auth/register').send({ ...VALID, ...overrides });
  return { response, cookie: cookieOf(response) };
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('sessions that survive a reload, against a real MySQL', () => {
  it('registering stores only the SHA-256 of the cookie, with a 7-day expiry', async () => {
    const { response, cookie } = await signUp();

    const rows = await RefreshToken.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.tokenHash).toMatch(/^[0-9a-f]{64}$/);
    expect(cookie).not.toContain(rows[0]!.tokenHash);
    expect(rows[0]?.userId).toBe(response.body.user.id);
    const days = (rows[0]!.expiresAt.getTime() - Date.now()) / 86_400_000;
    expect(days).toBeGreaterThan(6.9);
    expect(days).toBeLessThanOrEqual(7);
  });

  it('refresh restores the session from the cookie alone: user and a new access token', async () => {
    const { response, cookie } = await signUp();

    const refreshed = await refresh(cookie);

    expect(refreshed.status).toBe(200);
    expect(refreshed.body.user).toMatchObject({ email: 'ana@exemplo.com', isStaff: false });
    expect(verifyToken(refreshed.body.token)).toEqual({ sub: response.body.user.id });
    expect(cookieOf(refreshed)).not.toBe(cookie);
  });

  it('the new access token opens a protected route', async () => {
    const { cookie } = await signUp();
    const refreshed = await refresh(cookie);

    const profile = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${refreshed.body.token}`);

    expect(profile.status).toBe(200);
  });

  it('a cookie can be chained: each refresh hands the next one', async () => {
    const { cookie } = await signUp();
    const second = await refresh(cookie);
    const third = await refresh(cookieOf(second));

    expect(third.status).toBe(200);
    expect(await RefreshToken.count()).toBe(3);
  });

  it('the old cookie still works for a few seconds (two tabs opened together)', async () => {
    const { cookie } = await signUp();
    await refresh(cookie);

    expect((await refresh(cookie)).status).toBe(200);
  });

  it('the old cookie, used after the grace, ends every session of that account', async () => {
    const { cookie } = await signUp();
    const rotated = await refresh(cookie);
    await backdateRevocations();

    expect((await refresh(cookie)).status).toBe(401);
    expect((await refresh(cookieOf(rotated))).status).toBe(401);
    expect(await RefreshToken.count()).toBe(0);
  });

  it('ending the sessions of one account leaves the others alone', async () => {
    const ana = await signUp();
    const bia = await signUp({ email: 'bia@exemplo.com', name: 'Bia Lima' });
    await refresh(ana.cookie);
    await backdateRevocations();

    expect((await refresh(ana.cookie)).status).toBe(401);
    expect((await refresh(bia.cookie)).status).toBe(200);
  });

  it('an expired cookie is refused', async () => {
    const { cookie } = await signUp();
    await RefreshToken.update({ expiresAt: new Date(Date.now() - 1000) }, { where: {} });

    expect((await refresh(cookie)).status).toBe(401);
  });

  it('logout makes the cookie useless at once, with no grace', async () => {
    const { cookie } = await signUp();

    const out = await request(app).post('/api/auth/logout').set(XHR).set('Cookie', cookie);

    expect(out.status).toBe(204);
    expect((await refresh(cookie)).status).toBe(401);
  });

  it('deleting the account takes its sessions with it', async () => {
    const { cookie } = await signUp();
    await User.destroy({ where: {} });

    expect(await RefreshToken.count()).toBe(0);
    expect((await refresh(cookie)).status).toBe(401);
  });

  it('expired rows of the person are swept when a new session starts', async () => {
    const { response } = await signUp();
    await RefreshToken.update({ expiresAt: new Date(Date.now() - 1000) }, { where: {} });

    await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'uma-senha-boa' });

    const rows = await RefreshToken.findAll({ where: { userId: response.body.user.id } });
    expect(rows).toHaveLength(1);
    expect(rows[0]!.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it('a made-up cookie is refused', async () => {
    expect((await refresh(`${REFRESH_COOKIE}=inventado`)).status).toBe(401);
  });
});
