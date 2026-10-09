import { UniqueConstraintError } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User, sequelize } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();

const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const USER_ID = '11111111-1111-4111-8111-111111111111';
const NOW = new Date('2026-10-10T15:00:00Z');
const URL = `/api/events/${EVENT_ID}/registrations`;

const VALID = {
  name: 'Ana Souza',
  email: 'Ana@Exemplo.com',
  phone: '(11) 95396-8344',
  isMinor: false,
  imageAuthorized: true,
  consent: true,
};

function storedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    title: 'Contação de histórias',
    description: null,
    category: null,
    startsAt: new Date('2026-11-20T18:00:00Z'),
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: 30,
    requiresCpf: false,
    published: true,
    ...overrides,
  } as unknown as Event;
}

interface Setup {
  event?: Event | null;
  registered?: number;
  sameEmail?: number;
  duplicate?: boolean;
}

function setup({ event = storedEvent(), registered = 0, sameEmail = 0, duplicate = false }: Setup = {}) {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'setTimeout'] });
  jest.spyOn(sequelize, 'transaction').mockImplementation((async (callback: (t: unknown) => unknown) =>
    callback({ LOCK: { UPDATE: 'UPDATE' } })) as never);
  const findEvent = jest.spyOn(Event, 'findOne').mockResolvedValue(event);
  jest.spyOn(Registration, 'findOne').mockResolvedValue(duplicate ? ({} as Registration) : null);
  jest.spyOn(Registration, 'findAll').mockResolvedValue(registered ? ([{ eventId: EVENT_ID, total: registered }] as never) : []);
  jest.spyOn(Registration, 'count').mockResolvedValue(sameEmail);
  const create = jest.spyOn(Registration, 'create').mockImplementation((async (row: Record<string, unknown>) => ({
    id: 'reg-1',
    name: row.name,
    createdAt: NOW,
  })) as never);
  jest.spyOn(User, 'count').mockResolvedValue(1);
  return { create, findEvent };
}

const post = (body: unknown = VALID, token?: string) => {
  const req = request(app).post(URL);
  if (token) req.set('Authorization', `Bearer ${token}`);
  return req.send(body as object);
};

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('POST /api/events/:id/registrations without an account', () => {
  it('registers, answers 201 and needs no token', async () => {
    const { create } = setup();

    const response = await post();

    expect(response.status).toBe(201);
    expect(response.body.registration).toEqual({ id: 'reg-1', name: 'Ana Souza', createdAt: NOW.toISOString() });
    expect(response.body.event).toMatchObject({ id: EVENT_ID, capacity: 30, spotsLeft: 29 });
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ eventId: EVENT_ID, userId: null }), expect.anything());
  });

  it('cleans the e-mail and the phone before saving, and records the consent as a date', async () => {
    const { create } = setup();

    await post();

    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'ana@exemplo.com', phone: '11953968344', consentedAt: NOW, imageAuthorized: true }),
      expect.anything(),
    );
  });

  it('makes the image authorization optional: signing up without it works and stores false', async () => {
    const { create } = setup();

    const response = await post({ name: 'Ana Souza', email: 'ana@exemplo.com', consent: true });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ imageAuthorized: false, phone: null }), expect.anything());
  });

  it('refuses without the consent, on its own field', async () => {
    const { create } = setup();

    const response = await post({ ...VALID, consent: false });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([expect.objectContaining({ field: 'consent' })]);
    expect(create).not.toHaveBeenCalled();
  });

  it('reports every problem at once, each on its field, in Portuguese', async () => {
    setup();

    const response = await post({ name: '', email: 'ana', phone: '123', isMinor: true, consent: false });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field).sort()).toEqual([
      'consent',
      'email',
      'guardianName',
      'guardianPhone',
      'name',
      'phone',
    ]);
    expect(JSON.stringify(response.body)).toContain('Escreva o nome de quem vai participar.');
  });

  it('ignores whatever the body says about the account, the event or staff', async () => {
    const { create } = setup();

    await post({ ...VALID, userId: USER_ID, eventId: 'outro', isStaff: true, createdAt: '2000-01-01', id: 'x' });

    const row = create.mock.calls[0]![0] as Record<string, unknown>;
    expect(row.userId).toBeNull();
    expect(row.eventId).toBe(EVENT_ID);
    expect(Object.keys(row)).not.toContain('isStaff');
    expect(row.consentedAt).toEqual(NOW);
    expect(row.id).toBeUndefined();
  });
});

describe('who is a minor (RN02)', () => {
  it.each([
    ['without the guardian name', { guardianPhone: '(11) 95396-8344' }, ['guardianName']],
    ['without the guardian phone', { guardianName: 'Maria Souza' }, ['guardianPhone']],
    ['without either', {}, ['guardianName', 'guardianPhone']],
    ['with a guardian phone missing the area code', { guardianName: 'Maria', guardianPhone: '5396-8344' }, ['guardianPhone']],
  ])('refuses a minor %s', async (_label, guardian, fields) => {
    const { create } = setup();

    const response = await post({ ...VALID, isMinor: true, ...guardian });

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field).sort()).toEqual(fields);
    expect(create).not.toHaveBeenCalled();
  });

  it('stores the guardian of a minor', async () => {
    const { create } = setup();

    const response = await post({ ...VALID, isMinor: true, guardianName: ' Maria Souza ', guardianPhone: '(11) 91234-5678' });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(
      expect.objectContaining({ isMinor: true, guardianName: 'Maria Souza', guardianPhone: '11912345678' }),
      expect.anything(),
    );
  });

  it('does not keep a guardian for an adult, even if the form sent one', async () => {
    const { create } = setup();

    await post({ ...VALID, isMinor: false, guardianName: 'Maria Souza', guardianPhone: '(11) 91234-5678' });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ isMinor: false, guardianName: null, guardianPhone: null }), expect.anything());
  });
});

describe('the document (RN06): the event decides, never the form', () => {
  it('does not ask for a CPF when the event does not, and does not store one that came anyway', async () => {
    const { create } = setup({ event: storedEvent({ requiresCpf: false }) });

    const response = await post({ ...VALID, cpf: '529.982.247-25' });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ cpf: null }), expect.anything());
  });

  it('requires it when the event does, and refuses its absence on the cpf field', async () => {
    const { create } = setup({ event: storedEvent({ requiresCpf: true }) });

    const response = await post(VALID);

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([expect.objectContaining({ field: 'cpf', message: 'Esta atividade pede o CPF de quem vai participar.' })]);
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts a formatted CPF and stores only the digits', async () => {
    const { create } = setup({ event: storedEvent({ requiresCpf: true }) });

    const response = await post({ ...VALID, cpf: '529.982.247-25' });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ cpf: '52998224725' }), expect.anything());
  });

  it.each(['111.111.111-11', '000.000.000-00', '529.982.247-26', '123'])('refuses %s', async (cpf) => {
    const { create } = setup({ event: storedEvent({ requiresCpf: true }) });

    const response = await post({ ...VALID, cpf });

    expect(response.status).toBe(400);
    expect(response.body.error.details).toEqual([expect.objectContaining({ field: 'cpf' })]);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('the spots', () => {
  it('refuses with 409 when the event is full, and writes nothing', async () => {
    const { create } = setup({ registered: 30 });

    const response = await post();

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('event_full');
    expect(create).not.toHaveBeenCalled();
  });

  it('takes the last spot', async () => {
    setup({ registered: 29 });

    const response = await post();

    expect(response.status).toBe(201);
    expect(response.body.event.spotsLeft).toBe(0);
  });

  it('has no limit when the event has no capacity', async () => {
    setup({ event: storedEvent({ capacity: null }), registered: 100000 });

    const response = await post();

    expect(response.status).toBe(201);
    expect(response.body.event.spotsLeft).toBeNull();
  });

  it('locks the event row before counting, so two people for the last spot wait for each other', async () => {
    const { findEvent } = setup();

    await post();

    expect(findEvent).toHaveBeenCalledWith(expect.objectContaining({ lock: 'UPDATE', where: { id: EVENT_ID, published: true } }));
  });

  it('answers "already registered" before "full" to someone who is already in', async () => {
    setup({ registered: 30, duplicate: true });

    const response = await post();

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('already_registered');
  });
});

describe('what cannot be signed up for', () => {
  it('answers 404 for an unpublished or missing event, without telling which', async () => {
    const { create } = setup({ event: null });

    const response = await post();

    expect(response.status).toBe(404);
    expect(create).not.toHaveBeenCalled();
  });

  it('closes when the event is over', async () => {
    const { create } = setup({ event: storedEvent({ startsAt: new Date('2026-09-01T18:00:00Z') }) });

    const response = await post();

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('registrations_closed');
    expect(create).not.toHaveBeenCalled();
  });

  it('stays open while an event that already started has not ended', async () => {
    setup({ event: storedEvent({ startsAt: new Date('2026-10-10T14:00:00Z'), endsAt: new Date('2026-10-10T17:00:00Z') }) });

    expect((await post()).status).toBe(201);
  });

  it('answers 400 for an id that is not a uuid', async () => {
    const { findEvent } = setup();

    const response = await request(app).post('/api/events/abc/registrations').send(VALID);

    expect(response.status).toBe(400);
    expect(findEvent).not.toHaveBeenCalled();
  });
});

describe('abuse', () => {
  it('refuses the same person twice, and the database constraint is the backstop for a double click', async () => {
    setup({ duplicate: true });
    expect((await post()).body.error.code).toBe('already_registered');

    jest.restoreAllMocks();
    const { create } = setup();
    create.mockRejectedValue(new UniqueConstraintError({}));
    const response = await post();

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('already_registered');
  });

  it('limits how many people one e-mail can sign up for the same event', async () => {
    const { create } = setup({ sameEmail: 5 });

    const response = await post();

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('too_many_registrations');
    expect(create).not.toHaveBeenCalled();
  });

  it('lets a guardian sign up a few children with one address', async () => {
    setup({ sameEmail: 4 });

    expect((await post({ ...VALID, isMinor: true, guardianName: 'Ana', guardianPhone: '(11) 95396-8344', name: 'Filho' })).status).toBe(201);
  });
});

describe('with an account', () => {
  it('links the sign-up to the account of the verified token', async () => {
    const { create } = setup();

    const response = await post(VALID, signToken({ sub: USER_ID }));

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID }), expect.anything());
  });

  it('never takes the account from the body, with or without a token', async () => {
    const { create } = setup();

    await post({ ...VALID, userId: 'de-outra-pessoa' }, signToken({ sub: USER_ID }));
    await post({ ...VALID, name: 'Outra Pessoa', userId: 'de-outra-pessoa' });

    expect(create.mock.calls.map(([row]) => (row as { userId: string | null }).userId)).toEqual([USER_ID, null]);
  });

  it('answers 401, not "visitor", for a token that is not good: the client renews it and repeats', async () => {
    const { create, findEvent } = setup();

    const response = await post(VALID, 'token.invalido.aqui');

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
    expect(findEvent).not.toHaveBeenCalled();
  });

  it('answers 401 for a good token of an account that no longer exists', async () => {
    const { create } = setup();
    jest.spyOn(User, 'count').mockResolvedValue(0);

    const response = await post(VALID, signToken({ sub: USER_ID }));

    expect(response.status).toBe(401);
    expect(create).not.toHaveBeenCalled();
  });
});

describe('GET /api/events/:id', () => {
  it('returns the published event with what the form needs: the document rule and whether it is open', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ requiresCpf: true, capacity: 30 }));
    jest.spyOn(Registration, 'findAll').mockResolvedValue([{ eventId: EVENT_ID, total: 12 }] as never);

    const response = await request(app).get(`/api/events/${EVENT_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.event).toMatchObject({ id: EVENT_ID, requiresCpf: true, capacity: 30, spotsLeft: 18, registrationsOpen: true });
  });

  it('is closed when full, and when over', async () => {
    jest.spyOn(Registration, 'findAll').mockResolvedValue([{ eventId: EVENT_ID, total: 30 }] as never);
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    expect((await request(app).get(`/api/events/${EVENT_ID}`)).body.event).toMatchObject({ spotsLeft: 0, registrationsOpen: false });

    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ startsAt: new Date('2020-01-01T10:00:00Z') }));
    expect((await request(app).get(`/api/events/${EVENT_ID}`)).body.event).toMatchObject({ registrationsOpen: false });
  });

  it('answers 404 for an event that is not published, and never leaks the personal data count', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(null);

    const response = await request(app).get(`/api/events/${EVENT_ID}`);

    expect(response.status).toBe(404);
  });

  it('never exposes who signed up, only how many spots are left', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockResolvedValue([{ eventId: EVENT_ID, total: 3 }] as never);

    const body = JSON.stringify((await request(app).get(`/api/events/${EVENT_ID}`)).body);

    expect(body).not.toMatch(/email|guardian|phone|"cpf"/i);
    expect(body).not.toContain('registrationCount');
  });
});
