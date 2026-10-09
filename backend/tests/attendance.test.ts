import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { maskPhone } from '../src/services/attendance.service';
import { signToken } from '../src/utils/token';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const REGISTRATION_ID = '33333333-3333-4333-8333-333333333333';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const LIST = `/api/admin/events/${EVENT_ID}/attendance`;
const MARK = `${LIST}/${REGISTRATION_ID}`;

function row(overrides: Record<string, unknown> = {}) {
  const base = { id: REGISTRATION_ID, eventId: EVENT_ID, name: 'Ana Souza', isMinor: false, attended: null, update: jest.fn(), ...overrides };
  base.update.mockImplementation(async (values: Record<string, unknown>) => Object.assign(base, values));
  return base as unknown as Registration;
}

function asStaff(isStaff = true) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff } as unknown as User);
  jest.spyOn(Event, 'findByPk').mockResolvedValue({
    id: EVENT_ID,
    title: 'Cafú e o Café',
    description: null,
    category: null,
    startsAt: new Date('2030-10-17T17:00:00Z'),
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: null,
    requiresCpf: false,
    published: true,
    updatedAt: new Date('2026-10-09T12:00:00Z'),
  } as unknown as Event);
}

afterEach(() => jest.restoreAllMocks());

describe('who may use the attendance list (RN05)', () => {
  it.each([
    ['get', LIST],
    ['patch', MARK],
  ] as const)('%s %s answers 401 without a token and 403 to someone who is not staff, before touching a registration', async (method, path) => {
    const findAll = jest.spyOn(Registration, 'findAll');
    const findOne = jest.spyOn(Registration, 'findOne');
    expect((await request(app)[method](path).send({ attended: true })).status).toBe(401);

    asStaff(false);
    expect((await request(app)[method](path).set(auth).send({ attended: true })).status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/events/:id/attendance', () => {
  it('lists the people by name, with only what the door needs', async () => {
    asStaff();
    const findAll = jest
      .spyOn(Registration, 'findAll')
      .mockImplementation((async (options?: { group?: unknown }) =>
        options?.group ? [] : [row({ attended: true }), row({ id: 'r2', name: 'Pedro', isMinor: true })]) as never);

    const response = await request(app).get(LIST).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.event.title).toBe('Cafú e o Café');
    expect(response.body.data).toEqual([
      { id: REGISTRATION_ID, name: 'Ana Souza', isMinor: false, guardianPhoneHint: null, attended: true },
      { id: 'r2', name: 'Pedro', isMinor: true, guardianPhoneHint: null, attended: null },
    ]);
    const listing = findAll.mock.calls.map(([options]) => options).find((options) => !options?.group)!;
    expect(listing.where).toEqual({ eventId: EVENT_ID });
    expect(listing.attributes).toEqual(['id', 'name', 'isMinor', 'guardianPhone', 'attended']);
    expect(listing.order).toEqual([['name', 'ASC'], ['createdAt', 'ASC']]);
  });

  it('never sends e-mail, phone, CPF, the whole guardian number or origin; a minor carries the number masked', async () => {
    asStaff();
    jest.spyOn(Registration, 'findAll').mockImplementation((async (options?: { group?: unknown }) =>
      options?.group
        ? []
        : [
            row({ email: 'ana@exemplo.com', phone: '11953968344', cpf: '52998224725', guardianName: 'Maria', guardianPhone: '11912345678', originHash: 'x', isMinor: true }),
            row({ id: 'r2', guardianPhone: '11912345678', isMinor: false }),
          ]) as never);

    const { body } = await request(app).get(LIST).set(auth);

    expect(Object.keys(body.data[0]).sort()).toEqual(['attended', 'guardianPhoneHint', 'id', 'isMinor', 'name']);
    expect(body.data[0].guardianPhoneHint).toBe('(11) 9····-5678');
    expect(body.data[1].guardianPhoneHint).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/ana@|95396|52998|originHash|Maria|91234/);
  });

  it('answers 404 for an event that does not exist, and 400 for an identifier that is not a UUID', async () => {
    asStaff();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);
    expect((await request(app).get(LIST).set(auth)).status).toBe(404);
    expect((await request(app).get('/api/admin/events/not-a-uuid/attendance').set(auth)).status).toBe(400);
  });
});

describe('PATCH /api/admin/events/:id/attendance/:registrationId', () => {
  it.each([true, false, null])('records %s', async (attended) => {
    asStaff();
    const registration = row({ attended: attended === null ? true : null });
    jest.spyOn(Registration, 'findOne').mockResolvedValue(registration);

    const response = await request(app).patch(MARK).set(auth).send({ attended });

    expect(response.status).toBe(200);
    expect(response.body.registration).toEqual({ id: REGISTRATION_ID, name: 'Ana Souza', isMinor: false, guardianPhoneHint: null, attended });
    expect(registration.update).toHaveBeenCalledWith({ attended });
  });

  it('looks the registration up by id AND event, so an id from another event is a 404', async () => {
    asStaff();
    const findOne = jest.spyOn(Registration, 'findOne').mockResolvedValue(null);

    const response = await request(app).patch(MARK).set(auth).send({ attended: true });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('registration_not_found');
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: REGISTRATION_ID, eventId: EVENT_ID });
  });

  it.each([{}, { attended: 'yes' }, { attended: 1 }, { attended: undefined }])('rejects the body %j with 400 and writes nothing', async (body) => {
    asStaff();
    const findOne = jest.spyOn(Registration, 'findOne');

    const response = await request(app).patch(MARK).set(auth).send(body);

    expect(response.status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('writes the attendance column and nothing else, whatever the body carries', async () => {
    asStaff();
    const registration = row();
    jest.spyOn(Registration, 'findOne').mockResolvedValue(registration);

    await request(app).patch(MARK).set(auth).send({ attended: true, name: 'Outro', imageAuthorized: true, userId: STAFF_ID, eventId: 'x' });

    expect(registration.update).toHaveBeenCalledWith({ attended: true });
  });
});

describe('maskPhone', () => {
  it('keeps the area code, the first digit and the last four', () => {
    expect(maskPhone('11912345678')).toBe('(11) 9····-5678');
    expect(maskPhone('1133334444')).toBe('(11) 3····-4444');
  });

  it.each([null, '', '123', '119123456789'])('gives nothing for %j', (value) => {
    expect(maskPhone(value)).toBeNull();
  });
});
