import { UniqueConstraintError } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models';
import { signToken, verifyToken } from '../src/utils/token';

jest.mock('../src/utils/password', () => ({
  hashPassword: jest.fn(async (password: string) => `hashed:${password}`),
  verifyPassword: jest.fn(async (password: string, hash: string) => hash === `hashed:${password}`),
}));

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

function storedUser(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10',
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    phone: '11953968344',
    personType: 'individual',
    passwordHash: 'hashed:uma-senha-boa',
    wantsToVolunteer: true,
    wantsToDonate: false,
    isStaff: false,
    ...overrides,
  } as unknown as User;
}

function fieldsOf(body: { error: { details: { field: string }[] } }) {
  return body.error.details.map((detail) => detail.field).sort();
}

afterEach(() => jest.restoreAllMocks());

describe('POST /api/auth/register', () => {
  it('creates the account and signs the person in', async () => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser());

    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(response.status).toBe(201);
    expect(verifyToken(response.body.token)).toEqual({ sub: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10' });
    expect(response.body.user).toMatchObject({ name: 'Ana Souza', email: 'ana@exemplo.com', isStaff: false });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('never sends the password or its hash back', async () => {
    jest.spyOn(User, 'create').mockResolvedValue(storedUser());

    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(JSON.stringify(response.body)).not.toMatch(/hash|uma-senha-boa/);
    expect(Object.keys(response.body.user).sort()).toEqual(
      ['email', 'id', 'isStaff', 'name', 'personType', 'phone', 'wantsToDonate', 'wantsToVolunteer'].sort(),
    );
  });

  it('stores a hash of the password, never the password', async () => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser());

    await request(app).post('/api/auth/register').send(VALID);

    const row = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(row.passwordHash).toBe('hashed:uma-senha-boa');
    expect(JSON.stringify(row)).not.toContain('"uma-senha-boa"');
  });

  it.each([
    ['isStaff', true],
    ['is_staff', true],
    ['role', 'admin'],
    ['roles', ['staff']],
    ['id', '00000000-0000-0000-0000-000000000000'],
    ['passwordHash', 'hashed:qualquer'],
  ])('cannot be given %s through the body (RF08, rule 13)', async (field, value) => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser());

    const response = await request(app).post('/api/auth/register').send({ ...VALID, [field]: value });

    expect(response.status).toBe(201);
    const row = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(row.isStaff).toBe(false);
    expect(row).not.toHaveProperty('role');
    expect(row).not.toHaveProperty('roles');
    expect(row).not.toHaveProperty('is_staff');
    expect(row).not.toHaveProperty('id');
    expect(row.passwordHash).toBe('hashed:uma-senha-boa');
  });

  describe('age confirmation (RF12, RN01)', () => {
    it.each([
      ['missing', undefined],
      ['false', false],
      ['the string "true"', 'true'],
      ['the string "on"', 'on'],
      ['1', 1],
      ['null', null],
    ])('refuses when confirmsAdult is %s, and creates nothing', async (_label, value) => {
      const create = jest.spyOn(User, 'create');
      const body = { ...VALID, confirmsAdult: value };
      if (value === undefined) delete (body as Partial<typeof VALID>).confirmsAdult;

      const response = await request(app).post('/api/auth/register').send(body);

      expect(response.status).toBe(400);
      expect(fieldsOf(response.body)).toEqual(['confirmsAdult']);
      expect(response.body.error.details[0].message).toMatch(/18 anos ou mais/);
      expect(create).not.toHaveBeenCalled();
    });
  });

  it('refuses without the data consent', async () => {
    const create = jest.spyOn(User, 'create');

    const response = await request(app).post('/api/auth/register').send({ ...VALID, consent: false });

    expect(response.status).toBe(400);
    expect(fieldsOf(response.body)).toEqual(['consent']);
    expect(create).not.toHaveBeenCalled();
  });

  it('requires at least one way to take part, and says so on its own field', async () => {
    const response = await request(app).post('/api/auth/register').send({ ...VALID, wantsToVolunteer: false, wantsToDonate: false });

    expect(response.status).toBe(400);
    expect(fieldsOf(response.body)).toEqual(['participation']);
  });

  it('accepts both roles at once (RF09: roles accumulate)', async () => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser({ wantsToDonate: true }));

    const response = await request(app).post('/api/auth/register').send({ ...VALID, wantsToDonate: true });

    expect(response.status).toBe(201);
    expect(create.mock.calls[0]![0]).toMatchObject({ wantsToVolunteer: true, wantsToDonate: true });
  });

  it('reports every problem at once, so the form can show them all', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'sem-arroba', password: 'curta', confirmsAdult: false, consent: false, wantsToVolunteer: false });

    expect(response.status).toBe(400);
    expect(fieldsOf(response.body)).toEqual(['confirmsAdult', 'consent', 'email', 'name', 'participation', 'password', 'personType']);
  });

  it('writes every message in Portuguese and says what to do', async () => {
    const response = await request(app).post('/api/auth/register').send({});

    for (const detail of response.body.error.details) expect(detail.message).not.toMatch(/Invalid|expected|Required|received/i);
  });

  it('normalizes the e-mail and the phone before saving', async () => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser());

    await request(app).post('/api/auth/register').send({ ...VALID, email: '  ANA@Exemplo.COM ', phone: ' (11) 95396-8344 ' });

    expect(create.mock.calls[0]![0]).toMatchObject({ email: 'ana@exemplo.com', phone: '11953968344' });
  });

  it.each([[undefined], [null], ['']])('treats an empty phone (%s) as no phone', async (phone) => {
    const create = jest.spyOn(User, 'create').mockResolvedValue(storedUser({ phone: null }));

    const response = await request(app).post('/api/auth/register').send({ ...VALID, phone });

    expect(response.status).toBe(201);
    expect(create.mock.calls[0]![0]).toMatchObject({ phone: null });
  });

  it.each([['1195396'], ['119539683441'], ['abc']])('refuses the phone %s, which is not 10 or 11 digits', async (phone) => {
    const response = await request(app).post('/api/auth/register').send({ ...VALID, phone });

    expect(response.status).toBe(400);
    expect(fieldsOf(response.body)).toEqual(['phone']);
  });

  it('refuses a password bcrypt would silently truncate', async () => {
    const response = await request(app).post('/api/auth/register').send({ ...VALID, password: 'ã'.repeat(37) });

    expect(response.status).toBe(400);
    expect(fieldsOf(response.body)).toEqual(['password']);
  });

  it('answers 409 on the e-mail field when the address is already registered', async () => {
    jest.spyOn(User, 'create').mockRejectedValue(new UniqueConstraintError({}));

    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('email_taken');
    expect(fieldsOf(response.body)).toEqual(['email']);
  });

  it('does not hide a database failure behind a validation message', async () => {
    jest.spyOn(User, 'create').mockRejectedValue(new Error('connection lost'));
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const response = await request(app).post('/api/auth/register').send(VALID);

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain('connection lost');
  });
});

describe('POST /api/auth/login', () => {
  it('signs in with the right credentials', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValue(storedUser());

    const response = await request(app).post('/api/auth/login').send({ email: 'ANA@exemplo.com', password: 'uma-senha-boa' });

    expect(response.status).toBe(200);
    expect(verifyToken(response.body.token).sub).toBe('3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10');
    expect(response.body.user.email).toBe('ana@exemplo.com');
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('looks the account up by the normalized e-mail', async () => {
    const findOne = jest.spyOn(User, 'findOne').mockResolvedValue(storedUser());

    await request(app).post('/api/auth/login').send({ email: '  ANA@Exemplo.com ', password: 'uma-senha-boa' });

    expect(findOne.mock.calls[0]![0]).toEqual({ where: { email: 'ana@exemplo.com' } });
  });

  it('answers the same for a wrong password and for an unknown e-mail, so it does not reveal who has an account', async () => {
    jest.spyOn(User, 'findOne').mockResolvedValueOnce(storedUser()).mockResolvedValueOnce(null);

    const wrongPassword = await request(app).post('/api/auth/login').send({ email: 'ana@exemplo.com', password: 'senha-errada' });
    const unknownEmail = await request(app).post('/api/auth/login').send({ email: 'ninguem@exemplo.com', password: 'senha-errada' });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body).toEqual(unknownEmail.body);
    expect(wrongPassword.body.error).toEqual({ code: 'invalid_credentials', message: 'E-mail ou senha não conferem.' });
  });

  it('compares against a real bcrypt hash when the e-mail is unknown, so it costs as much as a wrong password', async () => {
    const { verifyPassword } = jest.requireMock('../src/utils/password') as { verifyPassword: jest.Mock };
    jest.spyOn(User, 'findOne').mockResolvedValue(null);
    verifyPassword.mockClear();

    await request(app).post('/api/auth/login').send({ email: 'ninguem@exemplo.com', password: 'qualquer-coisa' });

    expect(verifyPassword).toHaveBeenCalledTimes(1);
    expect(verifyPassword).toHaveBeenCalledWith('qualquer-coisa', expect.stringMatching(/^\$2[aby]\$12\$.{53}$/));
  });

  it.each([[{}], [{ email: 'ana@exemplo.com' }], [{ password: 'x' }], [{ email: 'nao-e-email', password: 'x' }]])(
    'refuses a malformed body %j with 400, without touching the database',
    async (body) => {
      const findOne = jest.spyOn(User, 'findOne');

      const response = await request(app).post('/api/auth/login').send(body);

      expect(response.status).toBe(400);
      expect(findOne).not.toHaveBeenCalled();
    },
  );

  it('does not accept an object where the e-mail should be (no query injection)', async () => {
    const findOne = jest.spyOn(User, 'findOne');

    const response = await request(app).post('/api/auth/login').send({ email: { $ne: null }, password: 'x' });

    expect(response.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe('GET /api/auth/me (RNF-SEG-01: protected route)', () => {
  it('rejects a request without a token', async () => {
    const response = await request(app).get('/api/auth/me');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('unauthenticated');
  });

  it('rejects a token signed with another key', async () => {
    const forged = require('jsonwebtoken').sign({ sub: 'x' }, 'outra-chave-com-mais-de-trinta-e-dois-caracteres');

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(401);
  });

  it('rejects an expired token', async () => {
    const expired = require('jsonwebtoken').sign({ sub: 'x', exp: Math.floor(Date.now() / 1000) - 10 }, process.env.JWT_SECRET);

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${expired}`);

    expect(response.status).toBe(401);
  });

  it('returns the account of the token, without the hash', async () => {
    const findByPk = jest.spyOn(User, 'findByPk').mockResolvedValue(storedUser());
    const token = signToken({ sub: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10' });

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('ana@exemplo.com');
    expect(JSON.stringify(response.body)).not.toMatch(/hash/i);
    expect(findByPk.mock.calls[0]![1]).toEqual({ attributes: { exclude: ['passwordHash'] } });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('treats a valid token of an account that no longer exists as signed out', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(null);
    const token = signToken({ sub: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10' });

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(401);
  });

  it('reads the staff flag from the database, not from the token', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(storedUser({ isStaff: false }));
    const token = require('jsonwebtoken').sign({ sub: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10', isStaff: true }, process.env.JWT_SECRET);

    const response = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);

    expect(response.body.user.isStaff).toBe(false);
  });
});
