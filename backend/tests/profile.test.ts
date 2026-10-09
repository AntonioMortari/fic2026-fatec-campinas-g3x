import request from 'supertest';
import { createApp } from '../src/app';
import { User } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();
const USER_ID = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: `Bearer ${signToken({ sub: USER_ID })}` };
const VALID = { name: 'Ana Paula Souza', phone: '(11) 98765-4321', personType: 'individual' };

function stored(overrides: Record<string, unknown> = {}) {
  const row = {
    id: USER_ID,
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    phone: null,
    personType: 'organization',
    wantsToVolunteer: true,
    wantsToDonate: false,
    isStaff: false,
    update: jest.fn(),
    ...overrides,
  };
  row.update.mockImplementation(async (values: Record<string, unknown>) => Object.assign(row, values));
  return row as unknown as User;
}

afterEach(() => jest.restoreAllMocks());

describe('PATCH /api/me', () => {
  it('needs a session and touches nothing without one', async () => {
    const findByPk = jest.spyOn(User, 'findByPk');

    const response = await request(app).patch('/api/me').send(VALID);

    expect(response.status).toBe(401);
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('saves name, phone (only digits) and person type, and returns the public user', async () => {
    const row = stored();
    jest.spyOn(User, 'findByPk').mockResolvedValue(row);

    const response = await request(app).patch('/api/me').set(auth).send(VALID);

    expect(response.status).toBe(200);
    expect(row.update).toHaveBeenCalledWith({ name: 'Ana Paula Souza', phone: '11987654321', personType: 'individual' });
    expect(response.body.user).toEqual({
      id: USER_ID,
      name: 'Ana Paula Souza',
      email: 'ana@exemplo.com',
      phone: '11987654321',
      personType: 'individual',
      wantsToVolunteer: true,
      wantsToDonate: false,
      isStaff: false,
    });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('clears the phone when it comes empty', async () => {
    const row = stored({ phone: '11987654321' });
    jest.spyOn(User, 'findByPk').mockResolvedValue(row);

    await request(app).patch('/api/me').set(auth).send({ ...VALID, phone: '' });

    expect(row.update).toHaveBeenCalledWith(expect.objectContaining({ phone: null }));
  });

  it('writes exactly three columns, whatever the body carries (rule 13)', async () => {
    const row = stored();
    jest.spyOn(User, 'findByPk').mockResolvedValue(row);

    await request(app)
      .patch('/api/me')
      .set(auth)
      .send({ ...VALID, email: 'outro@exemplo.com', isStaff: true, is_staff: true, role: 'admin', id: 'x', passwordHash: 'x', password: 'nova-senha-boa', wantsToDonate: true });

    expect(row.update).toHaveBeenCalledTimes(1);
    expect(Object.keys((row.update as jest.Mock).mock.calls[0]![0]).sort()).toEqual(['name', 'personType', 'phone']);
  });

  it('updates the account of the token, never one named in the body or the URL', async () => {
    const findByPk = jest.spyOn(User, 'findByPk').mockResolvedValue(stored());

    await request(app).patch('/api/me?id=99999999-9999-4999-8999-999999999999').set(auth).send({ ...VALID, id: '99999999-9999-4999-8999-999999999999', userId: '9' });

    expect(findByPk.mock.calls[0]![0]).toBe(USER_ID);
  });

  it('answers 401 when the account of the token no longer exists', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(null);

    const response = await request(app).patch('/api/me').set(auth).send(VALID);

    expect(response.status).toBe(401);
  });

  it.each([
    ['an empty name', { name: '   ' }, 'name', 'Escreva seu nome.'],
    ['a name over 120 characters', { name: 'a'.repeat(121) }, 'name', 'O nome passou de 120 caracteres.'],
    ['a phone one digit short', { phone: '(11) 9876-432' }, 'phone', 'Falta um dígito. Exemplo: (11) 98765-4321.'],
    ['a phone without the area code', { phone: '98765432' }, 'phone', 'O telefone precisa incluir o DDD, como (11) 95396-8344.'],
    ['an unknown person type', { personType: 'admin' }, 'personType', 'Escolha se a conta é de uma pessoa ou de uma instituição.'],
  ])('refuses %s with 400, pointing at the field, and writes nothing', async (_label, patch, field, message) => {
    const findByPk = jest.spyOn(User, 'findByPk');

    const response = await request(app).patch('/api/me').set(auth).send({ ...VALID, ...patch });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([expect.objectContaining({ field, message })]);
    expect(findByPk).not.toHaveBeenCalled();
  });
});
