import { Op, UniqueConstraintError } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { User, VolunteerApplication, VolunteerApplicationArea, VolunteerArea, sequelize } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();
const USER_ID = '11111111-1111-4111-8111-111111111111';
const OTHER_ID = '99999999-9999-4999-8999-999999999999';
const auth = { Authorization: `Bearer ${signToken({ sub: USER_ID })}` };
const NOW = new Date('2026-10-11T15:00:00Z');

const area = (id: string, name: string, sortOrder: number, description = `Texto de ${name}`) => ({ id, name, description, sortOrder }) as unknown as VolunteerArea;
const PEDAGOGICAL = area('apoio-pedagogico', 'Apoio pedagógico e oficinas', 1);
const COMMUNICATION = area('comunicacao', 'Comunicação e mídias', 2);

function setup({ alive = false, areas = [PEDAGOGICAL, COMMUNICATION], userExists = true }: { alive?: boolean; areas?: VolunteerArea[]; userExists?: boolean } = {}) {
  const transaction = { LOCK: { UPDATE: 'UPDATE' } };
  jest.spyOn(sequelize, 'transaction').mockImplementation((async (callback: (t: unknown) => unknown) => callback(transaction)) as never);
  jest.spyOn(User, 'count').mockResolvedValue(userExists ? 1 : 0);
  jest.spyOn(VolunteerArea, 'findAll').mockImplementation((async (options: { where: { id: { [Op.in]: string[] } } }) =>
    areas.filter((entry) => options.where.id[Op.in].includes(entry.id))) as never);
  const findOne = jest.spyOn(VolunteerApplication, 'findOne').mockResolvedValue(alive ? ({ id: 'live' } as VolunteerApplication) : null);
  const create = jest.spyOn(VolunteerApplication, 'create').mockImplementation((async (row: Record<string, unknown>) => ({
    id: 'app-1',
    status: row.status,
    message: row.message,
    createdAt: NOW,
  })) as never);
  const bulkCreate = jest.spyOn(VolunteerApplicationArea, 'bulkCreate').mockResolvedValue([]);
  return { transaction, findOne, create, bulkCreate };
}

const post = (body: unknown, headers: Record<string, string> = auth) => request(app).post('/api/volunteer-applications').set(headers).send(body as object);

afterEach(() => jest.restoreAllMocks());

describe('GET /api/volunteer-areas', () => {
  it('is public and lists the areas in the order the staff defined, with their text', async () => {
    const findAll = jest.spyOn(VolunteerArea, 'findAll').mockResolvedValue([PEDAGOGICAL, COMMUNICATION]);

    const response = await request(app).get('/api/volunteer-areas');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([
      { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas', description: 'Texto de Apoio pedagógico e oficinas' },
      { id: 'comunicacao', name: 'Comunicação e mídias', description: 'Texto de Comunicação e mídias' },
    ]);
    expect(findAll.mock.calls[0]![0]).toMatchObject({ order: [['sortOrder', 'ASC']] });
  });
});

describe('POST /api/volunteer-applications', () => {
  it('needs a session and writes nothing without one', async () => {
    const { create } = setup();

    const response = await request(app).post('/api/volunteer-applications').send({ areas: ['acervo'] });

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it('answers 401 when the account in the token no longer exists', async () => {
    const { create } = setup({ userExists: false });

    const response = await post({ areas: ['comunicacao'] });

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });

  it('registers the application for the account of the token, always as new', async () => {
    const { create, bulkCreate } = setup();

    const response = await post({ areas: ['apoio-pedagogico', 'comunicacao'], message: '  Sábado de manhã.  ' });

    expect(response.status).toBe(201);
    expect(response.body.application).toEqual({
      id: 'app-1',
      status: 'new',
      message: 'Sábado de manhã.',
      createdAt: NOW.toISOString(),
      areas: [
        { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas' },
        { id: 'comunicacao', name: 'Comunicação e mídias' },
      ],
    });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(create.mock.calls[0]![0]).toEqual({ userId: USER_ID, status: 'new', message: 'Sábado de manhã.' });
    expect(bulkCreate.mock.calls[0]![0]).toEqual([
      { applicationId: 'app-1', areaId: 'apoio-pedagogico' },
      { applicationId: 'app-1', areaId: 'comunicacao' },
    ]);
  });

  it('ignores a hostile body: status, user id and anything else the form does not have', async () => {
    const { create } = setup();

    await post({
      areas: ['comunicacao'],
      status: 'volunteering',
      userId: OTHER_ID,
      user_id: OTHER_ID,
      id: OTHER_ID,
      createdAt: '2020-01-01T00:00:00Z',
      isStaff: true,
    });

    expect(create.mock.calls[0]![0]).toEqual({ userId: USER_ID, status: 'new', message: null });
  });

  it('turns an empty message into null', async () => {
    const { create } = setup();

    await post({ areas: ['comunicacao'], message: '   ' });

    expect(create.mock.calls[0]![0]).toMatchObject({ message: null });
  });

  it('reduces repeated areas to one before asking the database', async () => {
    const { bulkCreate } = setup();
    const findAll = jest.spyOn(VolunteerArea, 'findAll');

    const response = await post({ areas: ['comunicacao', 'comunicacao', 'comunicacao'] });

    expect(response.status).toBe(201);
    expect(bulkCreate.mock.calls[0]![0]).toHaveLength(1);
    const where = findAll.mock.calls[0]![0]!.where as { id: { [Op.in]: string[] } };
    expect(where.id[Op.in]).toEqual(['comunicacao']);
  });

  it.each([
    ['no areas', { areas: [] }],
    ['areas missing', {}],
    ['areas not a list', { areas: 'comunicacao' }],
    ['a blank area', { areas: [''] }],
    ['an area that is not an identifier', { areas: ['Apoio pedagógico e oficinas'] }],
  ])('refuses %s with the error on the areas field, writing nothing', async (_name, body) => {
    const { create } = setup();

    const response = await post(body);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_data');
    expect(response.body.error.details[0].field).toBe('areas');
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses an area that does not exist, naming the field', async () => {
    const { create } = setup();

    const response = await post({ areas: ['comunicacao', 'inventada'] });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([{ location: 'body', field: 'areas', message: 'Escolha só entre as áreas da lista.' }]);
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts exactly 2000 characters and refuses 2001, on the message field', async () => {
    const { create } = setup();

    expect((await post({ areas: ['comunicacao'], message: 'a'.repeat(2000) })).status).toBe(201);
    const refused = await post({ areas: ['comunicacao'], message: 'a'.repeat(2001) });

    expect(refused.status).toBe(400);
    expect(refused.body.error.details[0]).toMatchObject({ field: 'message' });
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('refuses a second application while one is alive, before writing anything', async () => {
    const { create, bulkCreate, findOne } = setup({ alive: true });

    const response = await post({ areas: ['comunicacao'] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('already_applied');
    expect(create).not.toHaveBeenCalled();
    expect(bulkCreate).not.toHaveBeenCalled();
    const where = findOne.mock.calls[0]![0]!.where as { userId: string; status: { [Op.ne]: string } };
    expect(where.userId).toBe(USER_ID);
    expect(where.status[Op.ne]).toBe('ended');
  });

  it('answers 409 too when the database index catches a simultaneous second submission', async () => {
    const { create } = setup();
    create.mockRejectedValue(new UniqueConstraintError({}));

    const response = await post({ areas: ['comunicacao'] });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('already_applied');
  });

  it('writes the application and its areas inside one transaction', async () => {
    const { create, bulkCreate, transaction } = setup();

    await post({ areas: ['comunicacao', 'apoio-pedagogico'] });

    expect(create.mock.calls[0]![1]).toEqual({ transaction });
    expect(bulkCreate.mock.calls[0]![1]).toEqual({ transaction });
  });

  it('does not hide a failure while saving the areas: the transaction callback rejects, so it rolls back', async () => {
    const { bulkCreate } = setup();
    bulkCreate.mockRejectedValue(new Error('disk full'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await post({ areas: ['comunicacao'] });

    expect(response.status).toBe(500);
    expect(response.body.error.code).toBe('internal_error');
  });
});

describe('GET /api/me/volunteer-applications', () => {
  const row = (id: string, status: string, createdAt: string, areas = [COMMUNICATION]) =>
    ({ id, status, message: null, createdAt: new Date(createdAt), areas }) as unknown as VolunteerApplication;

  it('needs a session, and reads nothing without one', async () => {
    const findAll = jest.spyOn(VolunteerApplication, 'findAll');

    const response = await request(app).get('/api/me/volunteer-applications');

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('asks only for the rows of the account in the token, never of anyone else, and is never cached', async () => {
    const findAll = jest.spyOn(VolunteerApplication, 'findAll').mockResolvedValue([]);

    const response = await request(app).get(`/api/me/volunteer-applications?userId=${OTHER_ID}`).set(auth).set('X-User-Id', OTHER_ID);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(findAll.mock.calls[0]![0]!.where).toEqual({ userId: USER_ID });
  });

  it('lists the live ones first, newest on top, and sinks the ended ones without dropping them', async () => {
    jest.spyOn(VolunteerApplication, 'findAll').mockResolvedValue([
      row('ended-new', 'ended', '2026-10-01T10:00:00Z'),
      row('live-old', 'in_contact', '2026-09-01T10:00:00Z'),
      row('live-new', 'new', '2026-10-09T10:00:00Z'),
      row('ended-old', 'ended', '2025-03-01T10:00:00Z', [PEDAGOGICAL]),
    ]);

    const { body } = await request(app).get('/api/me/volunteer-applications').set(auth);

    expect(body.data.map((entry: { id: string }) => entry.id)).toEqual(['live-new', 'live-old', 'ended-new', 'ended-old']);
    expect(body.data[3]).toMatchObject({ status: 'ended', areas: [{ id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas' }] });
  });

  it('puts the areas of each application in the order the staff defined', async () => {
    jest.spyOn(VolunteerApplication, 'findAll').mockResolvedValue([row('a', 'new', '2026-10-09T10:00:00Z', [COMMUNICATION, PEDAGOGICAL])]);

    const { body } = await request(app).get('/api/me/volunteer-applications').set(auth);

    expect(body.data[0].areas.map((entry: { id: string }) => entry.id)).toEqual(['apoio-pedagogico', 'comunicacao']);
  });

  it('never sends the account id or anything about the person back', async () => {
    jest.spyOn(VolunteerApplication, 'findAll').mockResolvedValue([row('a', 'new', '2026-10-09T10:00:00Z')]);

    const { body } = await request(app).get('/api/me/volunteer-applications').set(auth);

    expect(Object.keys(body.data[0]).sort()).toEqual(['areas', 'createdAt', 'id', 'message', 'status']);
  });
});
