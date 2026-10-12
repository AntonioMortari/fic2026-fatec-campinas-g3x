import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { createEvent } from '../src/services/admin-events.service';
import { getPublishedEventDetail, registrationStatus, FEW_SPOTS_THRESHOLD } from '../src/services/events.service';
import { signToken } from '../src/utils/token';

const app = createApp();

const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const START = new Date('2026-10-17T17:00:00Z');
const BEFORE = new Date(START.getTime() - 1);

const base = { startsAt: START, registrationOnSite: true, capacity: 12 as number | null };

function storedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    title: 'Cafú e o Café',
    description: 'Uma viagem.\n\nContação.',
    category: null,
    startsAt: START,
    endsAt: null,
    location: 'Sede do Ateliê',
    ageRange: 'Livre',
    capacity: 12,
    requiresCpf: false,
    registrationOnSite: true,
    published: true,
    updatedAt: new Date('2026-10-09T12:00:00Z'),
    imageUpdatedAt: null,
    imageAlt: null,
    ...overrides,
  } as unknown as Event;
}

afterEach(() => jest.restoreAllMocks());

describe('registrationStatus: the rules of design 13c, in order', () => {
  it('is open with room, and "few left" at the threshold and below', () => {
    expect(registrationStatus(base, 0, BEFORE)).toBe('open');
    expect(registrationStatus(base, 12 - FEW_SPOTS_THRESHOLD - 1, BEFORE)).toBe('open');
    expect(registrationStatus(base, 12 - FEW_SPOTS_THRESHOLD, BEFORE)).toBe('few_left');
    expect(registrationStatus(base, 11, BEFORE)).toBe('few_left');
  });

  it('is full at the capacity and beyond', () => {
    expect(registrationStatus(base, 12, BEFORE)).toBe('full');
    expect(registrationStatus(base, 13, BEFORE)).toBe('full');
  });

  it('has no limit when there is no capacity, however many people are in', () => {
    expect(registrationStatus({ ...base, capacity: null }, 5000, BEFORE)).toBe('open');
  });

  it('is "not on site" when the event does not take sign-ups here, even if there is room', () => {
    expect(registrationStatus({ ...base, registrationOnSite: false }, 0, BEFORE)).toBe('not_on_site');
  });

  it('is started at the exact instant it begins, and still open one millisecond before', () => {
    expect(registrationStatus(base, 0, BEFORE)).toBe('open');
    expect(registrationStatus(base, 0, START)).toBe('started');
    expect(registrationStatus(base, 0, new Date(START.getTime() + 1))).toBe('started');
  });

  it('checks "started" before "not on site", and "not on site" before "full"', () => {
    expect(registrationStatus({ ...base, registrationOnSite: false }, 99, START)).toBe('started');
    expect(registrationStatus({ ...base, registrationOnSite: false }, 99, BEFORE)).toBe('not_on_site');
  });

  it('is unknown when the count failed and a capacity makes the count matter; otherwise the count is not needed', () => {
    expect(registrationStatus(base, null, BEFORE)).toBe('unknown');
    expect(registrationStatus({ ...base, capacity: null }, null, BEFORE)).toBe('open');
    expect(registrationStatus({ ...base, registrationOnSite: false }, null, BEFORE)).toBe('not_on_site');
    expect(registrationStatus(base, null, START)).toBe('started');
  });
});

describe('GET /api/events/:id: the detail the page needs', () => {
  it('carries the status, the site flag, the spots and the image field', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockResolvedValue([{ eventId: EVENT_ID, total: 10 }] as never);

    const { body } = await request(app).get(`/api/events/${EVENT_ID}`);

    expect(body.event).toMatchObject({ registrationOnSite: true, registrationStatus: 'few_left', spotsLeft: 2, capacity: 12, image: null, registrationsOpen: true });
  });

  it('answers a draft with 404, the same as an event that does not exist', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(null);

    const response = await request(app).get(`/api/events/${EVENT_ID}`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('event_not_found');
  });

  it('only looks for published events', async () => {
    const findOne = jest.spyOn(Event, 'findOne').mockResolvedValue(null);

    await request(app).get(`/api/events/${EVENT_ID}`);

    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: EVENT_ID, published: true });
  });

  it('does not turn a failed count into zero or into open: the page still loads, with status unknown and no number', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockRejectedValue(new Error('banco fora'));

    const response = await request(app).get(`/api/events/${EVENT_ID}`);

    expect(response.status).toBe(200);
    expect(response.body.event.registrationStatus).toBe('unknown');
    expect(response.body.event.spotsLeft).toBeNull();
    expect(response.body.event.capacity).toBe(12);
  });

  it('closes at the exact instant of the start', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

    expect((await getPublishedEventDetail(EVENT_ID, BEFORE))?.registrationStatus).toBe('open');
    const started = await getPublishedEventDetail(EVENT_ID, START);
    expect(started?.registrationStatus).toBe('started');
    expect(started?.registrationsOpen).toBe(false);
  });

  it('is not open when it is not on the site, and when it is full', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ registrationOnSite: false, capacity: null }));
    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
    expect((await getPublishedEventDetail(EVENT_ID, BEFORE))?.registrationsOpen).toBe(false);

    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockResolvedValue([{ eventId: EVENT_ID, total: 12 }] as never);
    expect((await getPublishedEventDetail(EVENT_ID, BEFORE))?.registrationStatus).toBe('full');
  });
});

describe('GET /api/events: a failed count does not take the whole list down', () => {
  it('still lists the event, with status unknown', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Event, 'findAll').mockResolvedValue([storedEvent({ startsAt: new Date('2099-01-01T10:00:00Z') })]);
    jest.spyOn(Registration, 'findAll').mockRejectedValue(new Error('banco fora'));

    const response = await request(app).get('/api/events');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toMatchObject({ registrationStatus: 'unknown', spotsLeft: null });
  });
});

describe('admin form: "sem inscrição pelo site" clears what only makes sense with it (13d)', () => {
  const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
  const VALID = { title: 'Show', startsAt: '2026-11-20T15:00', capacity: 18, requiresCpf: true };

  beforeEach(() => {
    jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: true } as unknown as User);
    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
  });

  it('writes capacity null and no CPF on create, whatever the body says', async () => {
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    const response = await request(app).post('/api/admin/events').set(auth).send({ ...VALID, registrationOnSite: false });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ registrationOnSite: false, capacity: null, requiresCpf: false }));
  });

  it('writes the same on update', async () => {
    const update = jest.fn();
    jest.spyOn(Event, 'findByPk').mockResolvedValue({ ...storedEvent(), update } as unknown as Event);

    await request(app).put(`/api/admin/events/${EVENT_ID}`).set(auth).send({ ...VALID, registrationOnSite: false });

    expect(update).toHaveBeenCalledWith(expect.objectContaining({ registrationOnSite: false, capacity: null, requiresCpf: false }));
  });

  it('keeps the capacity and the CPF when the sign-up is on the site, which is the default', async () => {
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());

    await request(app).post('/api/admin/events').set(auth).send(VALID);

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ registrationOnSite: true, capacity: 18, requiresCpf: true }));
  });

  it('refuses a registrationOnSite that is not a boolean', async () => {
    const create = jest.spyOn(Event, 'create');

    const response = await request(app).post('/api/admin/events').set(auth).send({ ...VALID, registrationOnSite: 'nao' });

    expect(response.status).toBe(400);
    expect(create).not.toHaveBeenCalled();
  });

  it('never lets saving the form touch the photo or the publication', async () => {
    const update = jest.fn();
    jest.spyOn(Event, 'findByPk').mockResolvedValue({ ...storedEvent(), update } as unknown as Event);

    await request(app)
      .put(`/api/admin/events/${EVENT_ID}`)
      .set(auth)
      .send({ ...VALID, published: true, imageData: 'AAAA', imageMime: 'image/png', imageAlt: 'x', imageAuthorizedAt: '2026-01-01', imageUpdatedAt: '2026-01-01' });

    const written = Object.keys(update.mock.calls[0]![0] as object);
    expect(written.filter((key) => key.startsWith('image') || key === 'published')).toEqual([]);
  });
});

describe('the service clears spots and CPF by itself when the sign-up is not on the site', () => {
  it('does not depend on the validator having done it', async () => {
    const create = jest.spyOn(Event, 'create').mockResolvedValue(storedEvent());
    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

    await createEvent({
      title: 'x',
      description: null,
      category: null,
      startsAt: START,
      endsAt: null,
      location: null,
      ageRange: null,
      capacity: 20,
      requiresCpf: true,
      registrationOnSite: false,
    });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ capacity: null, requiresCpf: false, registrationOnSite: false }));
  });
});
