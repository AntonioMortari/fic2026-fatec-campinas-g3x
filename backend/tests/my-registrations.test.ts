import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();
const USER_ID = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: `Bearer ${signToken({ sub: USER_ID })}` };
const DAY = 24 * 60 * 60 * 1000;
const ago = (days: number) => new Date(Date.now() - days * DAY).toISOString();
const ahead = (days: number) => new Date(Date.now() + days * DAY).toISOString();

const event = (id: string, startsAt: string, overrides: Record<string, unknown> = {}) =>
  ({ id, title: `Evento ${id}`, startsAt: new Date(startsAt), endsAt: null, location: 'Casa Verde', ...overrides }) as unknown as Event;

const registration = (id: string, eventId: string, overrides: Record<string, unknown> = {}) =>
  ({ id, eventId, name: 'Ana Souza', attended: null, cancelCode: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', createdAt: new Date('2026-10-01T10:00:00Z'), ...overrides }) as unknown as Registration;

afterEach(() => jest.restoreAllMocks());

describe('GET /api/me/registrations', () => {
  it('needs a session, and reads nothing without one', async () => {
    const findAll = jest.spyOn(Registration, 'findAll');

    const response = await request(app).get('/api/me/registrations');

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('asks only for the rows of the account in the token (never of anyone else) and is never cached', async () => {
    const findAll = jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

    const response = await request(app).get('/api/me/registrations').set(auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ data: [] });
    expect(response.headers['cache-control']).toBe('no-store');
    expect(findAll.mock.calls[0]![0]!.where).toEqual({ userId: USER_ID, cancelledAt: null });
  });

  it('ignores a user id sent in the query or the headers', async () => {
    const findAll = jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

    await request(app).get('/api/me/registrations?userId=99999999-9999-4999-8999-999999999999').set(auth).set('X-User-Id', 'x');

    expect(findAll.mock.calls[0]![0]!.where).toEqual({ userId: USER_ID, cancelledAt: null });
  });

  it('lists each sign-up with its event, soonest first, and says which events are over', async () => {
    jest.spyOn(Registration, 'findAll').mockResolvedValue([registration('r1', 'e-past'), registration('r2', 'e-next', { name: 'Pedro' })]);
    jest.spyOn(Event, 'findAll').mockResolvedValue([event('e-next', ahead(20)), event('e-past', ago(20))]);

    const { body } = await request(app).get('/api/me/registrations').set(auth);

    expect(body.data.map((entry: { id: string }) => entry.id)).toEqual(['r1', 'r2']);
    expect(body.data[0]).toMatchObject({ name: 'Ana Souza', event: { id: 'e-past', title: 'Evento e-past', isOver: true } });
    expect(body.data[1]).toMatchObject({ name: 'Pedro', event: { id: 'e-next', isOver: false } });
  });

  it('tells the person only when attendance was recorded; "did not come" and "not checked" look the same', async () => {
    jest.spyOn(Registration, 'findAll').mockResolvedValue([
      registration('r1', 'e1', { attended: true }),
      registration('r2', 'e1', { attended: false }),
      registration('r3', 'e1', { attended: null }),
    ]);
    jest.spyOn(Event, 'findAll').mockResolvedValue([event('e1', ago(20))]);

    const { body } = await request(app).get('/api/me/registrations').set(auth);

    expect(body.data.map((entry: { attendanceRecorded: boolean }) => entry.attendanceRecorded)).toEqual([true, false, false]);
    expect(JSON.stringify(body)).not.toMatch(/"attended"/);
  });

  it('never exposes contact, CPF, guardian or origin of the registration', async () => {
    jest.spyOn(Registration, 'findAll').mockResolvedValue([
      registration('r1', 'e1', { email: 'a@exemplo.com', phone: '11953968344', cpf: '52998224725', guardianName: 'G', originHash: 'x' }),
    ]);
    jest.spyOn(Event, 'findAll').mockResolvedValue([event('e1', ahead(20), { published: false })]);

    const { body } = await request(app).get('/api/me/registrations').set(auth);

    expect(Object.keys(body.data[0]).sort()).toEqual(['attendanceRecorded', 'cancelCode', 'event', 'id', 'name', 'registeredAt']);
    expect(Object.keys(body.data[0].event).sort()).toEqual(['endsAt', 'id', 'isOver', 'location', 'startsAt', 'title']);
    expect(JSON.stringify(body)).not.toMatch(/exemplo|95396|52998|originHash|guardian/);
  });
});
