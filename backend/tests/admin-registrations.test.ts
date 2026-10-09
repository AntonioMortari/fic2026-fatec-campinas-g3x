import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { formatCpf, formatPhone } from '../src/services/admin-registrations.service';
import { signToken } from '../src/utils/token';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const URL = `/api/admin/events/${EVENT_ID}/registrations`;

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: 'r1',
    eventId: EVENT_ID,
    userId: null,
    name: 'Ana Souza',
    email: 'ana@exemplo.com',
    phone: '11953968344',
    cpf: null,
    isMinor: false,
    guardianName: null,
    guardianPhone: null,
    imageAuthorized: true,
    originHash: 'a'.repeat(64),
    consentedAt: new Date('2026-10-09T12:00:00Z'),
    createdAt: new Date('2026-10-09T15:30:00Z'),
    ...overrides,
  } as unknown as Registration;
}

function setup(rows: Registration[] = [row()]) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: true } as unknown as User);
  jest.spyOn(Event, 'findByPk').mockResolvedValue({
    id: EVENT_ID,
    title: 'Cafú e o Café',
    description: null,
    category: null,
    startsAt: new Date('2030-10-17T17:00:00Z'),
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: 10,
    requiresCpf: false,
    published: true,
    updatedAt: new Date('2026-10-09T12:00:00Z'),
  } as unknown as Event);
  jest.spyOn(Registration, 'findAll').mockImplementation((async (options?: { group?: unknown }) =>
    options?.group ? [{ eventId: EVENT_ID, total: rows.length }] : rows) as never);
}

afterEach(() => jest.restoreAllMocks());

describe('who may read the sign-ups (RN05)', () => {
  it.each([URL, `${URL}.csv`])('GET %s answers 401 without a token and 403 to someone who is not staff, before reading anything', async (path) => {
    const findAll = jest.spyOn(Registration, 'findAll');
    expect((await request(app).get(path)).status).toBe(401);

    jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: false } as unknown as User);
    expect((await request(app).get(path).set(auth)).status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('is not opened by a staff claim written into the token', async () => {
    const jwt = await import('jsonwebtoken');
    jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: false } as unknown as User);
    const forged = jwt.sign({ sub: STAFF_ID, isStaff: true }, process.env.JWT_SECRET as string, { algorithm: 'HS256' });

    expect((await request(app).get(URL).set('Authorization', `Bearer ${forged}`)).status).toBe(403);
  });

  it('is never cached', async () => {
    setup();

    expect((await request(app).get(URL).set(auth)).headers['cache-control']).toBe('no-store');
    expect((await request(app).get(`${URL}.csv`).set(auth)).headers['cache-control']).toBe('no-store');
  });
});

describe('GET /api/admin/events/:id/registrations', () => {
  it('lists who signed up, with the event and the contact the staff needs', async () => {
    setup([row(), row({ id: 'r2', name: 'Pedro Souza', isMinor: true, guardianName: 'Ana Souza', guardianPhone: '11953968344', imageAuthorized: false, cpf: '52998224725', userId: 'u1' })]);

    const response = await request(app).get(URL).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.event).toMatchObject({ id: EVENT_ID, title: 'Cafú e o Café', registrationCount: 2 });
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data[1]).toEqual({
      id: 'r2',
      name: 'Pedro Souza',
      email: 'ana@exemplo.com',
      phone: '11953968344',
      cpf: '52998224725',
      isMinor: true,
      guardianName: 'Ana Souza',
      guardianPhone: '11953968344',
      imageAuthorized: false,
      hasAccount: true,
      createdAt: '2026-10-09T15:30:00.000Z',
    });
  });

  it('carries the image authorization on every row, true or false (RN07)', async () => {
    setup([row({ imageAuthorized: true }), row({ id: 'r2', imageAuthorized: false })]);

    const { body } = await request(app).get(URL).set(auth);

    expect(body.data.map((entry: { imageAuthorized: boolean }) => entry.imageAuthorized)).toEqual([true, false]);
  });

  it('never exposes the account id or the origin hash', async () => {
    setup([row({ userId: '99999999-9999-4999-8999-999999999999' })]);

    const text = JSON.stringify((await request(app).get(URL).set(auth)).body);

    expect(text).not.toContain('99999999');
    expect(text).not.toContain('aaaaaaaa');
    expect(text).not.toMatch(/originHash|userId/);
  });

  it('reads in the order they signed up', async () => {
    setup();

    await request(app).get(URL).set(auth);

    const calls = (Registration.findAll as jest.Mock).mock.calls.map(([options]) => options).filter((options) => !options?.group);
    expect(calls[0]).toMatchObject({ where: { eventId: EVENT_ID }, order: [['createdAt', 'ASC'], ['name', 'ASC']] });
  });

  it('answers 404 for an event that does not exist, and 400 for an id that is not a uuid', async () => {
    setup();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

    expect((await request(app).get(URL).set(auth)).status).toBe(404);
    expect((await request(app).get('/api/admin/events/abc/registrations').set(auth)).status).toBe(400);
  });

  it('reads only: nothing can correct, add or delete a sign-up through here', async () => {
    setup();
    const create = jest.spyOn(Registration, 'create');
    const destroy = jest.spyOn(Registration, 'destroy');
    const update = jest.spyOn(Registration, 'update');

    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const response = await request(app)[method](URL).set(auth).send({ name: 'x' });
      expect(response.status).toBe(404);
    }
    expect(create).not.toHaveBeenCalled();
    expect(destroy).not.toHaveBeenCalled();
    expect(update).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/events/:id/registrations.csv', () => {
  it('downloads a UTF-8 file with BOM, named after the event', async () => {
    setup();

    const response = await request(app).get(`${URL}.csv`).set(auth).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks).toString('utf8')));
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toBe('attachment; filename="inscritos-cafu-e-o-cafe.csv"');
    expect(response.body.startsWith('﻿')).toBe(true);
  });

  it('puts the image column right after the name, before any contact, and every row carries it', async () => {
    setup([row({ imageAuthorized: true }), row({ id: 'r2', name: 'Bia Lima', email: 'bia@exemplo.com', imageAuthorized: false })]);

    const text = (await request(app).get(`${URL}.csv`).set(auth)).text;
    const [header, first, second] = text.replace('﻿', '').trim().split('\r\n') as [string, string, string];
    const columns = header.split(';');

    expect(columns.slice(0, 3)).toEqual(['Nome', 'Autorizou imagem', 'Menor de idade']);
    expect(columns.indexOf('Autorizou imagem')).toBeLessThan(columns.indexOf('E-mail'));
    expect(columns.indexOf('Autorizou imagem')).toBeLessThan(columns.indexOf('Telefone'));
    expect(first.split(';')[1]).toBe('Sim');
    expect(second.split(';')[1]).toBe('Não');
  });

  it('writes the contact formatted, the date in São Paulo time and the CPF with its mask', async () => {
    setup([row({ cpf: '52998224725', createdAt: new Date('2026-10-10T01:30:00Z') })]);

    const [, line] = (await request(app).get(`${URL}.csv`).set(auth)).text.replace('﻿', '').trim().split('\r\n') as [string, string];
    const cells = line.split(';');

    expect(cells).toContain('(11) 95396-8344');
    expect(cells).toContain('529.982.247-25');
    expect(cells.at(-1)).toBe('09/10/2026 22:30');
  });

  it('neutralizes a name that would run as a formula in the spreadsheet', async () => {
    setup([row({ name: '=HYPERLINK("http://mau.example","x")', email: '+5511@exemplo.com' })]);

    const text = (await request(app).get(`${URL}.csv`).set(auth)).text;

    expect(text).toContain(`"'=HYPERLINK(""http://mau.example"",""x"")"`);
    expect(text).toContain(`'+5511@exemplo.com`);
    expect(text).not.toMatch(/(^|;|\r\n)=HYPERLINK/);
  });

  it('has the header and nothing else for an event nobody signed up for', async () => {
    setup([]);

    const text = (await request(app).get(`${URL}.csv`).set(auth)).text;

    expect(text.replace('﻿', '').trim().split('\r\n')).toHaveLength(1);
  });
});

describe('formatting', () => {
  it('formats phones and CPF, and leaves what it does not recognize', () => {
    expect(formatPhone('11953968344')).toBe('(11) 95396-8344');
    expect(formatPhone('1138968344')).toBe('(11) 3896-8344');
    expect(formatPhone(null)).toBe('');
    expect(formatPhone('123')).toBe('123');
    expect(formatCpf('52998224725')).toBe('529.982.247-25');
    expect(formatCpf(null)).toBe('');
  });
});
