import { Op } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration } from '../src/models';

const app = createApp();

function fakeEvent(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10',
    title: 'Cafú e o Café',
    description: null,
    category: 'Contação de história',
    startsAt: new Date('2026-10-17T17:00:00Z'),
    endsAt: null,
    location: 'Sede, Vila Romero',
    ageRange: 'Livre',
    capacity: 18,
    published: true,
    ...overrides,
  } as unknown as Event;
}

beforeEach(() => {
  jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

describe('GET /api/events', () => {
  it('lists upcoming events by default, soonest first, only published', async () => {
    const findAll = jest.spyOn(Event, 'findAll').mockResolvedValue([fakeEvent()]);

    const response = await request(app).get('/api/events');

    expect(response.status).toBe(200);
    expect(response.body.data[0]).toEqual({
      id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10',
      title: 'Cafú e o Café',
      description: null,
      category: 'Contação de história',
      startsAt: '2026-10-17T17:00:00.000Z',
      endsAt: null,
      location: 'Sede, Vila Romero',
      ageRange: 'Livre',
      capacity: 18,
      spotsLeft: 18,
    });
    const options = findAll.mock.calls[0]![0]!;
    expect(options.where).toMatchObject({ published: true });
    expect(options.order).toEqual([['startsAt', 'ASC']]);
  });

  it('lists past events newest first', async () => {
    const findAll = jest.spyOn(Event, 'findAll').mockResolvedValue([]);

    const response = await request(app).get('/api/events?period=past&limit=5');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
    const options = findAll.mock.calls[0]![0]!;
    expect(options.order).toEqual([['startsAt', 'DESC']]);
    expect(options.limit).toBe(5);
    expect(options.where).toMatchObject({ published: true, [Op.or]: expect.any(Array) });
  });

  it('never exposes fields outside the public shape', async () => {
    jest.spyOn(Event, 'findAll').mockResolvedValue([fakeEvent({ published: true, internalNote: 'segredo' })]);

    const response = await request(app).get('/api/events');

    expect(Object.keys(response.body.data[0]).sort()).toEqual(
      ['ageRange', 'capacity', 'category', 'description', 'endsAt', 'id', 'location', 'spotsLeft', 'startsAt', 'title'].sort(),
    );
  });

  it.each(['period=someday', 'limit=0', 'limit=101', 'limit=abc'])('rejects %s with 400', async (query) => {
    const findAll = jest.spyOn(Event, 'findAll');

    const response = await request(app).get(`/api/events?${query}`);

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_data');
    expect(findAll).not.toHaveBeenCalled();
  });
});

describe('GET /api/events/:id/calendar.ics', () => {
  it('downloads the event as a calendar file', async () => {
    const findOne = jest.spyOn(Event, 'findOne').mockResolvedValue(fakeEvent());

    const response = await request(app).get('/api/events/3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10/calendar.ics');

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('text/calendar');
    expect(response.headers['content-disposition']).toBe('attachment; filename="cafu-e-o-cafe.ics"');
    expect(response.text).toContain('SUMMARY:Cafú e o Café');
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10', published: true });
  });

  it('responds 404 for an unknown or unpublished event', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(null);

    const response = await request(app).get('/api/events/3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10/calendar.ics');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('event_not_found');
  });

  it('responds 400 for an identifier that is not a UUID, without touching the database', async () => {
    const findOne = jest.spyOn(Event, 'findOne');

    const response = await request(app).get('/api/events/not-a-uuid/calendar.ics');

    expect(response.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });
});
