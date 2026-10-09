import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { DEV_ACCOUNTS, DEV_PASSWORD, seedDevAccounts } from '../../src/database/seed';
import { RefreshToken, sequelize, User } from '../../src/models';

const app = createApp();
const LOCAL = { NODE_ENV: 'development', DB_HOST: 'localhost' } as const;

const [ADMIN, ORDINARY] = DEV_ACCOUNTS;

async function signIn(email: string) {
  const response = await request(app).post('/api/auth/login').send({ email, password: DEV_PASSWORD });
  return response;
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

describe('the development seed against a real MySQL', () => {
  it('creates both accounts, and both can sign in through the real API with the documented password', async () => {
    await seedDevAccounts(LOCAL);

    for (const account of DEV_ACCOUNTS) {
      const response = await signIn(account.email);
      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({ email: account.email, isStaff: account.isStaff });
    }
  });

  it('the admin reaches the panel API and the ordinary user does not', async () => {
    await seedDevAccounts(LOCAL);
    const admin = (await signIn(ADMIN.email)).body.token as string;
    const ordinary = (await signIn(ORDINARY.email)).body.token as string;

    expect((await request(app).get('/api/admin/events').set('Authorization', `Bearer ${admin}`)).status).toBe(200);
    expect((await request(app).get('/api/admin/events').set('Authorization', `Bearer ${ordinary}`)).status).toBe(403);
  });

  it('can run again and again: two accounts, never more', async () => {
    await seedDevAccounts(LOCAL);
    await seedDevAccounts(LOCAL);
    await seedDevAccounts(LOCAL);

    expect(await User.count()).toBe(2);
  });

  it('puts things back when somebody changed them: password and roles', async () => {
    await seedDevAccounts(LOCAL);
    await User.update({ passwordHash: 'x'.repeat(60), isStaff: false }, { where: { email: ADMIN.email } });
    await User.update({ isStaff: true }, { where: { email: ORDINARY.email } });

    await seedDevAccounts(LOCAL);

    expect((await User.findOne({ where: { email: ADMIN.email } }))?.isStaff).toBe(true);
    expect((await User.findOne({ where: { email: ORDINARY.email } }))?.isStaff).toBe(false);
    expect((await signIn(ADMIN.email)).status).toBe(200);
  });

  it('leaves every other account alone', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Pessoa Real',
      email: 'real@exemplo.com',
      personType: 'individual',
      password: 'uma-senha-boa',
      wantsToVolunteer: true,
      confirmsAdult: true,
      consent: true,
    });
    const before = await User.findOne({ where: { email: 'real@exemplo.com' } });

    await seedDevAccounts(LOCAL);

    const after = await User.findOne({ where: { email: 'real@exemplo.com' } });
    expect(after?.passwordHash).toBe(before?.passwordHash);
    expect(after?.isStaff).toBe(false);
    expect(await User.count()).toBe(3);
  });

  it('writes nothing when it refuses', async () => {
    await expect(seedDevAccounts({ NODE_ENV: 'production', DB_HOST: 'localhost' })).rejects.toThrow();
    await expect(seedDevAccounts({ NODE_ENV: 'development', DB_HOST: 'remoto.exemplo.com' })).rejects.toThrow();

    expect(await User.count()).toBe(0);
  });
});
