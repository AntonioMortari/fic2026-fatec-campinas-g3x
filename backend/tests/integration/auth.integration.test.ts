import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { sequelize, User } from '../../src/models';
import { signToken, verifyToken } from '../../src/utils/token';

const app = createApp();

const VALID = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: '(11) 95396-8344',
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
};

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await User.destroy({ where: {}, truncate: true });
});

afterAll(async () => {
  await sequelize.close();
});

describe('accounts against a real MySQL', () => {
  it('saves a bcrypt hash, never the password, and the proof of age and consent', async () => {
    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(response.status).toBe(201);
    const row = await User.findOne({ where: { email: 'ana@exemplo.com' } });
    expect(row?.passwordHash).toMatch(/^\$2[aby]\$12\$.{53}$/);
    expect(row?.passwordHash).not.toContain('uma-senha-boa');
    expect(row?.adultConfirmedAt).toBeInstanceOf(Date);
    expect(row?.consentedAt).toBeInstanceOf(Date);
    expect(row?.phone).toBe('11953968344');
  });

  it.each([
    ['isStaff', true],
    ['is_staff', true],
    ['role', 'admin'],
  ])('never stores staff access sent through %s (RF08)', async (field, value) => {
    const response = await request(app).post('/api/auth/register').send({ ...VALID, [field]: value });

    expect(response.status).toBe(201);
    expect(response.body.user.isStaff).toBe(false);
    const row = await User.findOne({ where: { email: 'ana@exemplo.com' } });
    expect(row?.isStaff).toBe(false);
  });

  it('refuses a minor and writes nothing (RF12)', async () => {
    const response = await request(app).post('/api/auth/register').send({ ...VALID, confirmsAdult: false });

    expect(response.status).toBe(400);
    expect(await User.count()).toBe(0);
  });

  it('keeps one account per e-mail, whatever the letter case', async () => {
    await request(app).post('/api/auth/register').send(VALID);

    const again = await request(app).post('/api/auth/register').send({ ...VALID, email: 'ANA@Exemplo.com' });

    expect(again.status).toBe(409);
    expect(again.body.error.details[0].field).toBe('email');
    expect(await User.count()).toBe(1);
  });

  it('lets only one of two simultaneous sign-ups with the same e-mail through', async () => {
    const [first, second] = await Promise.all([
      request(app).post('/api/auth/register').send(VALID),
      request(app).post('/api/auth/register').send(VALID),
    ]);

    expect([first.status, second.status].sort()).toEqual([201, 409]);
    expect(await User.count()).toBe(1);
  });

  it('signs in with the password chosen at sign-up, and only with it', async () => {
    await request(app).post('/api/auth/register').send(VALID);

    const right = await request(app).post('/api/auth/login').send({ email: 'Ana@Exemplo.com', password: 'uma-senha-boa' });
    const wrong = await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'uma-senha-ruim' });
    const unknown = await request(app).post('/api/auth/login').send({ email: 'ninguem@exemplo.com', password: 'uma-senha-boa' });

    expect(right.status).toBe(200);
    expect(verifyToken(right.body.token).sub).toBe(right.body.user.id);
    expect(wrong.status).toBe(401);
    expect(unknown.status).toBe(401);
    expect(wrong.body).toEqual(unknown.body);
  });

  it('serves the account to its own token, and to nobody else', async () => {
    const { body } = await request(app).post('/api/auth/register').send(VALID);

    const own = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);
    const anonymous = await request(app).get('/api/auth/me');

    expect(own.status).toBe(200);
    expect(own.body.user).toMatchObject({ email: 'ana@exemplo.com', name: 'Ana Souza', isStaff: false });
    expect(anonymous.status).toBe(401);
  });

  it('treats the token of a deleted account as signed out', async () => {
    const { body } = await request(app).post('/api/auth/register').send(VALID);
    await User.destroy({ where: { id: body.user.id } });

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${body.token}`);

    expect(response.status).toBe(401);
  });

  it('does not let a stranger borrow another account by signing a token for its id with the wrong key', async () => {
    const { body } = await request(app).post('/api/auth/register').send(VALID);
    const forged = require('jsonwebtoken').sign({ sub: body.user.id }, 'outra-chave-com-mais-de-trinta-e-dois-caracteres');

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
    expect(signToken({ sub: body.user.id })).not.toBe(forged);
  });

  it('keeps accents and emoji in the name', async () => {
    const name = 'Conceição d’Ávila 🎶';

    const response = await request(app).post('/api/auth/register').send({ ...VALID, name });

    expect(response.body.user.name).toBe(name);
    expect((await User.findOne({ where: { email: 'ana@exemplo.com' } }))?.name).toBe(name);
  });

  it('rejects an unknown person type at the database too', async () => {
    await expect(
      User.create({
        name: 'x', email: 'x@exemplo.com', phone: null, personType: 'robot' as never, passwordHash: 'x',
        wantsToVolunteer: true, wantsToDonate: false, adultConfirmedAt: new Date(), consentedAt: new Date(),
      }),
    ).rejects.toThrow();
  });
});
