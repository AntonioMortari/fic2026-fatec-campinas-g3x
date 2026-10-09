import jwt from 'jsonwebtoken';
import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();

const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';

const auth = (id = STAFF_ID) => ({ Authorization: `Bearer ${signToken({ sub: id })}` });

const VALID = {
  title: 'Contação de histórias',
  description: 'Uma tarde de histórias.',
  category: 'Contação',
  startsAt: '2026-11-20T15:00',
  endsAt: '2026-11-20T17:00',
  location: 'Casa Verde',
  ageRange: 'A partir de 10 anos',
  capacity: 30,
  requiresCpf: false,
};

function storedEvent(overrides: Record<string, unknown> = {}) {
  const event: Record<string, unknown> = {
    id: EVENT_ID,
    title: 'Contação de histórias',
    description: null,
    category: null,
    startsAt: new Date('2026-11-20T18:00:00Z'),
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: null,
    requiresCpf: false,
    published: false,
    updatedAt: new Date('2026-10-09T12:00:00Z'),
    update: jest.fn(async (values: Record<string, unknown>) => Object.assign(event, values)),
    ...overrides,
  };
  return event as unknown as Event & { update: jest.Mock };
}

function asStaff(isStaff: boolean) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff } as unknown as User);
}

beforeEach(() => {
  jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

const ROUTES: [string, string, object | undefined][] = [
  ['get', '/api/admin/events', undefined],
  ['post', '/api/admin/events', VALID],
  ['get', `/api/admin/events/${EVENT_ID}`, undefined],
  ['put', `/api/admin/events/${EVENT_ID}`, VALID],
  ['patch', `/api/admin/events/${EVENT_ID}/publication`, { published: true }],
];

describe('who may use the admin routes (RF33, rule 13)', () => {
  it.each(ROUTES)('%s %s answers 401 without a token', async (method, path, body) => {
    const response = await (request(app) as never as Record<string, (p: string) => request.Test>)[method]!(path).send(body);

    expect(response.status).toBe(401);
  });

  it.each(ROUTES)('%s %s answers 403 to someone who is not staff, before touching any event', async (method, path, body) => {
    asStaff(false);
    const find = jest.spyOn(Event, 'findByPk');
    const create = jest.spyOn(Event, 'create');

    const response = await (request(app) as never as Record<string, (p: string) => request.Test>)[method]!(path).set(auth()).send(body);

    expect(response.status).toBe(403);
    expect(find).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });

  it('does not believe an isStaff claim written into the token: the database decides', async () => {
    asStaff(false);
    const forged = jwt.sign({ sub: STAFF_ID, isStaff: true, role: 'admin' }, process.env.JWT_SECRET as string, { algorithm: 'HS256' });

    const response = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${forged}`);

    expect(response.status).toBe(403);
  });

  it('answers 401 when the token is valid but the account no longer exists', async () => {
    jest.spyOn(User, 'findByPk').mockResolvedValue(null);

    expect((await request(app).get('/api/admin/events').set(auth())).status).toBe(401);
  });

  it('never caches what staff sees', async () => {
    asStaff(true);
    jest.spyOn(Event, 'findAll').mockResolvedValue([]);

    const response = await request(app).get('/api/admin/events').set(auth());

    expect(response.headers['cache-control']).toBe('no-store');
  });
});

describe('GET /api/admin/events', () => {
  it('lists drafts too, newest first, with the publication state', async () => {
    asStaff(true);
    const findAll = jest.spyOn(Event, 'findAll').mockResolvedValue([storedEvent(), storedEvent({ id: 'x', published: true })]);

    const response = await request(app).get('/api/admin/events').set(auth());

    expect(response.status).toBe(200);
    expect(response.body.data.map((event: { published: boolean }) => event.published)).toEqual([false, true]);
    expect(findAll).toHaveBeenCalledWith({ order: [['startsAt', 'DESC']] });
  });

  it('answers 404 for an event that does not exist, and 400 for an id that is not a uuid', async () => {
    asStaff(true);
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

    expect((await request(app).get(`/api/admin/events/${EVENT_ID}`).set(auth())).status).toBe(404);
    expect((await request(app).get('/api/admin/events/abc').set(auth())).status).toBe(400);
  });
});

describe('POST /api/admin/events: saving never publishes (RF13)', () => {
  it('creates a draft, whatever the body says about publication', async () => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    const response = await request(app).post('/api/admin/events').set(auth()).send({ ...VALID, published: true, publishedAt: 'now' });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ published: false }));
    expect(JSON.stringify(create.mock.calls)).not.toContain('publishedAt');
  });

  it('reads the date and time as São Paulo time and stores UTC', async () => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    await request(app).post('/api/admin/events').set(auth()).send(VALID);

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ startsAt: new Date('2026-11-20T18:00:00Z'), endsAt: new Date('2026-11-20T20:00:00Z') }),
    );
  });

  it('makes capacity, end time and the other optional fields really optional, and turns blanks into null', async () => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    const response = await request(app)
      .post('/api/admin/events')
      .set(auth())
      .send({ title: 'Roda de conversa', startsAt: '2026-11-20T15:00', endsAt: '', description: '  ', category: '', capacity: null });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ endsAt: null, description: null, category: null, location: null, ageRange: null, capacity: null, requiresCpf: false }),
    );
  });

  it('keeps the document requirement and the capacity when they are set', async () => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    await request(app).post('/api/admin/events').set(auth()).send({ ...VALID, requiresCpf: true, capacity: 12 });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ requiresCpf: true, capacity: 12 }));
  });

  it('reports every problem at once, each on its field, in Portuguese', async () => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create');

    const response = await request(app)
      .post('/api/admin/events')
      .set(auth())
      .send({ title: '', startsAt: 'amanhã', capacity: 0, requiresCpf: 'sim' });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field).sort()).toEqual(['capacity', 'requiresCpf', 'startsAt', 'title']);
    expect(JSON.stringify(response.body)).toContain('Escreva o título.');
    expect(create).not.toHaveBeenCalled();
  });

  it.each([
    ['an end before the start', { endsAt: '2026-11-20T14:00' }],
    ['an end equal to the start', { endsAt: '2026-11-20T15:00' }],
  ])('refuses %s, on the end field', async (_label, patch) => {
    asStaff(true);

    const response = await request(app).post('/api/admin/events').set(auth()).send({ ...VALID, ...patch });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([expect.objectContaining({ field: 'endsAt', message: 'O término precisa ser depois do início.' })]);
  });

  it.each([
    ['a capacity with decimals', { capacity: 2.5 }],
    ['a capacity as text', { capacity: '30' }],
    ['a negative capacity', { capacity: -1 }],
    ['a date that does not exist', { startsAt: '2026-02-30T10:00' }],
    ['a title past 200 characters', { title: 'x'.repeat(201) }],
  ])('refuses %s', async (_label, patch) => {
    asStaff(true);
    const create = jest.spyOn(Event, 'create');

    expect((await request(app).post('/api/admin/events').set(auth()).send({ ...VALID, ...patch })).status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('PUT /api/admin/events/:id', () => {
  it('edits the fields and does not touch publication, even if the body asks', async () => {
    asStaff(true);
    const event = storedEvent({ published: true });
    jest.spyOn(Event, 'findByPk').mockResolvedValue(event);

    const response = await request(app).put(`/api/admin/events/${EVENT_ID}`).set(auth()).send({ ...VALID, published: false });

    expect(response.status).toBe(200);
    expect(event.update).toHaveBeenCalledTimes(1);
    expect(Object.keys(event.update.mock.calls[0]![0] as object)).not.toContain('published');
    expect(response.body.event.published).toBe(true);
  });

  it('answers 404 for an event that does not exist', async () => {
    asStaff(true);
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

    expect((await request(app).put(`/api/admin/events/${EVENT_ID}`).set(auth()).send(VALID)).status).toBe(404);
  });
});

describe('PATCH /api/admin/events/:id/publication: publishing is its own gesture', () => {
  it('publishes and takes down', async () => {
    asStaff(true);
    const event = storedEvent();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(event);

    const published = await request(app).patch(`/api/admin/events/${EVENT_ID}/publication`).set(auth()).send({ published: true });
    const down = await request(app).patch(`/api/admin/events/${EVENT_ID}/publication`).set(auth()).send({ published: false });

    expect(published.body.event.published).toBe(true);
    expect(down.body.event.published).toBe(false);
    expect(event.update).toHaveBeenNthCalledWith(1, { published: true });
    expect(event.update).toHaveBeenNthCalledWith(2, { published: false });
  });

  it.each([{}, { published: 'true' }, { published: 1 }])('refuses a body that is not exactly a boolean: %j', async (body) => {
    asStaff(true);
    const find = jest.spyOn(Event, 'findByPk');

    expect((await request(app).patch(`/api/admin/events/${EVENT_ID}/publication`).set(auth()).send(body)).status).toBe(400);
    expect(find).not.toHaveBeenCalled();
  });

  it('changes nothing but publication: a body with other fields does not reach the model', async () => {
    asStaff(true);
    const event = storedEvent();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(event);

    await request(app).patch(`/api/admin/events/${EVENT_ID}/publication`).set(auth()).send({ published: true, title: 'Outro', capacity: 1 });

    expect(event.update).toHaveBeenCalledWith({ published: true });
  });
});

describe('what the screen must not offer: deleting (RF13)', () => {
  it('has no DELETE route, even for staff: it would take the sign-ups with the event', async () => {
    asStaff(true);

    const response = await request(app).delete(`/api/admin/events/${EVENT_ID}`).set(auth());

    expect(response.status).toBe(404);
  });
});
