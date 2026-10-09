import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, sequelize } from '../src/models';
import { shortName } from '../src/utils/short-name';

const app = createApp();
const CODE = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const URL = `/api/registrations/cancel/${CODE}`;
const DAY = 24 * 60 * 60 * 1000;

function registration(overrides: Record<string, unknown> = {}) {
  const row = {
    id: 'r1',
    eventId: 'e1',
    name: 'Ana Paula Souza',
    email: 'ana@exemplo.com',
    phone: '11953968344',
    cpf: '52998224725',
    guardianName: 'Maria',
    guardianPhone: '11912345678',
    cancelCode: CODE,
    cancelledAt: null as Date | null,
    update: jest.fn(),
    ...overrides,
  };
  row.update.mockImplementation(async (values: Record<string, unknown>) => Object.assign(row, values));
  return row as unknown as Registration;
}

const event = (overrides: Record<string, unknown> = {}) =>
  ({ id: 'e1', title: 'Cafú e o Café', startsAt: new Date(Date.now() + 5 * DAY), endsAt: null, location: 'Casa Verde', ...overrides }) as unknown as Event;

function setup(row: Registration | null, found: Event | null = event()) {
  jest.spyOn(sequelize, 'transaction').mockImplementation((async (callback: (t: unknown) => unknown) => callback({ LOCK: { UPDATE: 'UPDATE' } })) as never);
  const findOne = jest.spyOn(Registration, 'findOne').mockResolvedValue(row);
  jest.spyOn(Event, 'findByPk').mockResolvedValue(found);
  return { findOne };
}

afterEach(() => jest.restoreAllMocks());

describe('shortName', () => {
  it.each([
    ['Ana Paula Souza', 'Ana S.'],
    ['  maria   lima ', 'maria L.'],
    ['Zé', 'Zé'],
    ['Álvaro Ótimo', 'Álvaro Ó.'],
  ])('%j becomes %j', (name, expected) => {
    expect(shortName(name)).toBe(expected);
  });
});

describe('GET /api/registrations/cancel/:code', () => {
  it('needs no session, is never cached and answers with the event and the short name only', async () => {
    const { findOne } = setup(registration());

    const response = await request(app).get(URL);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ cancelCode: CODE });
    expect(response.body.registration).toEqual({
      state: 'active',
      name: 'Ana S.',
      event: { id: 'e1', title: 'Cafú e o Café', startsAt: expect.any(String), endsAt: null, location: 'Casa Verde' },
    });
  });

  it('never exposes contact, CPF, guardian, the whole name or the code itself', async () => {
    setup(registration());

    const { body } = await request(app).get(URL);

    expect(JSON.stringify(body)).not.toMatch(/ana@|95396|52998|Maria|Paula|cccccccc|91234/);
  });

  it.each([
    ['cancelled', registration({ cancelledAt: new Date() }), event()],
    ['over', registration(), event({ startsAt: new Date(Date.now() - 3 * DAY) })],
  ] as const)('says the state is %s', async (state, row, found) => {
    setup(row, found);

    expect((await request(app).get(URL)).body.registration.state).toBe(state);
  });

  it('answers 404 for a code nobody has, and 400 for something that is not a UUID, without touching the database', async () => {
    const { findOne } = setup(null);
    expect((await request(app).get(URL)).status).toBe(404);
    findOne.mockClear();

    expect((await request(app).get('/api/registrations/cancel/not-a-uuid')).status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe('POST /api/registrations/cancel/:code', () => {
  it('cancels, stamping the moment, and needs no session', async () => {
    const row = registration();
    setup(row);

    const response = await request(app).post(URL);

    expect(response.status).toBe(200);
    expect(response.body.registration.state).toBe('cancelled');
    expect(row.update).toHaveBeenCalledWith({ cancelledAt: expect.any(Date) }, expect.anything());
  });

  it('locks the row, so two taps at once cancel one time', async () => {
    const { findOne } = setup(registration());

    await request(app).post(URL);

    expect(findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: 'UPDATE' }));
  });

  it('answers 409 already_cancelled the second time and writes nothing', async () => {
    const row = registration({ cancelledAt: new Date() });
    setup(row);

    const response = await request(app).post(URL);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('already_cancelled');
    expect(row.update).not.toHaveBeenCalled();
  });

  it('refuses after the event, with its own code, and writes nothing', async () => {
    const row = registration();
    setup(row, event({ startsAt: new Date(Date.now() - 3 * DAY) }));

    const response = await request(app).post(URL);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('registrations_closed');
    expect(row.update).not.toHaveBeenCalled();
  });

  it('answers 404 for an unknown code and writes nothing', async () => {
    setup(null);
    expect((await request(app).post(URL)).status).toBe(404);
  });

  it('writes the cancellation column and nothing else, whatever the body carries', async () => {
    const row = registration();
    setup(row);

    await request(app).post(URL).send({ cancelledAt: null, name: 'Outro', eventId: 'x', attended: true });

    expect(row.update).toHaveBeenCalledWith({ cancelledAt: expect.any(Date) }, expect.anything());
  });
});
