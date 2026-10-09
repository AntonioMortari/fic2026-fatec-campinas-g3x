import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { signToken } from '../src/utils/token';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const DAY = 24 * 60 * 60 * 1000;

const ev = (id: string, title: string, startsAt: Date, endsAt: Date | null = null) =>
  ({ id, title, startsAt, endsAt, published: true }) as unknown as Event;

function asStaff(isStaff = true) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff } as unknown as User);
}

const group = (eventId: string, attended: boolean | null, isMinor: boolean, total: number) => ({ eventId, attended, isMinor, total });

afterEach(() => jest.restoreAllMocks());

describe('who may read the report (RN05)', () => {
  it.each(['/api/admin/report', '/api/admin/report/csv'])('GET %s answers 401 without a token and 403 to someone who is not staff, before counting', async (path) => {
    const findAll = jest.spyOn(Registration, 'findAll');
    expect((await request(app).get(path)).status).toBe(401);

    asStaff(false);
    expect((await request(app).get(path).set(auth)).status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('is never cached', async () => {
    asStaff();
    jest.spyOn(Event, 'findAll').mockResolvedValue([]);

    expect((await request(app).get('/api/admin/report').set(auth)).headers['cache-control']).toBe('no-store');
  });
});

describe('the query', () => {
  it.each(['period=week', 'offset=1', 'offset=-1.5', 'offset=abc', 'offset=-9999'])('refuses %s with 400 and counts nothing', async (query) => {
    asStaff();
    const findAll = jest.spyOn(Event, 'findAll');

    const response = await request(app).get(`/api/admin/report?${query}`).set(auth);

    expect(response.status).toBe(400);
    expect(findAll).not.toHaveBeenCalled();
  });

  it('defaults to this month', async () => {
    asStaff();
    jest.spyOn(Event, 'findAll').mockResolvedValue([]);

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(body).toMatchObject({ period: 'month', offset: 0 });
  });
});

describe('GET /api/admin/report', () => {
  function seed() {
    asStaff();
    const past1 = ev('e1', 'Oficina de tambores', new Date(Date.now() - 10 * DAY));
    const past2 = ev('e2', 'Sarau literário', new Date(Date.now() - 12 * DAY));
    const future = ev('e3', 'Ainda vem', new Date(Date.now() + 5 * DAY));
    const eventFind = jest.spyOn(Event, 'findAll').mockResolvedValue([past1, past2, future]);
    const regFind = jest.spyOn(Registration, 'findAll').mockResolvedValue([
      group('e1', true, false, 10),
      group('e1', true, true, 2),
      group('e1', false, false, 3),
      group('e1', null, false, 2),
      group('e2', true, true, 4),
      group('e2', null, false, 1),
    ] as never);
    return { eventFind, regFind };
  }

  it('counts the finished activities, the sign-ups, who came, who missed and who nobody checked', async () => {
    seed();

    const { body } = await request(app).get('/api/admin/report?period=month').set(auth);

    expect(body.totals).toEqual({ activities: 2, registered: 22, attended: 16, missed: 3, unchecked: 3, minorsAttended: 6 });
    expect(body.events).toEqual([
      expect.objectContaining({ id: 'e1', title: 'Oficina de tambores', registered: 17, attended: 12, missed: 3, unchecked: 2 }),
      expect.objectContaining({ id: 'e2', title: 'Sarau literário', registered: 5, attended: 4, missed: 0, unchecked: 1 }),
    ]);
    expect(body.eventsTotal).toBe(2);
  });

  it('the three counts of an activity always add up to its sign-ups: "not checked" is never folded into "missed"', async () => {
    seed();

    const { body } = await request(app).get('/api/admin/report').set(auth);

    for (const row of body.events) expect(row.attended + row.missed + row.unchecked).toBe(row.registered);
    expect(body.totals.attended + body.totals.missed + body.totals.unchecked).toBe(body.totals.registered);
  });

  it('leaves out the activity that has not happened yet, and asks only for published ones inside the window', async () => {
    const { eventFind, regFind } = seed();

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(body.events.map((row: { id: string }) => row.id)).not.toContain('e3');
    const where = eventFind.mock.calls[0]![0]!.where as Record<string, unknown>;
    expect(where.published).toBe(true);
    const countWhere = regFind.mock.calls[0]![0]!.where as { eventId: Record<symbol, string[]>; cancelledAt: null };
    expect(Object.getOwnPropertySymbols(countWhere.eventId).map((symbol) => countWhere.eventId[symbol])[0]).toEqual(['e1', 'e2']);
    expect(countWhere.cancelledAt).toBeNull();
  });

  it('lists only the five most recent, and still counts all of them in the totals', async () => {
    asStaff();
    const events = Array.from({ length: 7 }, (_, i) => ev(`e${i}`, `Atividade ${i}`, new Date(Date.now() - (i + 1) * DAY)));
    jest.spyOn(Event, 'findAll').mockResolvedValue(events);
    jest.spyOn(Registration, 'findAll').mockResolvedValue(events.map((event) => group(event.id, true, false, 2)) as never);

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(body.events).toHaveLength(5);
    expect(body.eventsTotal).toBe(7);
    expect(body.totals).toMatchObject({ activities: 7, registered: 14, attended: 14 });
  });

  it('with nothing in the period answers zeros that are real zeros, with no rows', async () => {
    asStaff();
    jest.spyOn(Event, 'findAll').mockResolvedValue([]);
    jest.spyOn(Registration, 'findAll').mockResolvedValue([]);

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(body.totals).toEqual({ activities: 0, registered: 0, attended: 0, missed: 0, unchecked: 0, minorsAttended: 0 });
    expect(body.events).toEqual([]);
  });

  it('turns a failed count into null, never into zero, and keeps what it could count', async () => {
    asStaff();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Event, 'findAll').mockResolvedValue([ev('e1', 'Oficina', new Date(Date.now() - DAY))]);
    jest.spyOn(Registration, 'findAll').mockRejectedValue(new Error('boom'));

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(body.totals).toEqual({ activities: 1, registered: null, attended: null, missed: null, unchecked: null, minorsAttended: null });
    expect(body.events[0]).toMatchObject({ title: 'Oficina', registered: null, attended: null });
  });

  it('turns everything into null when the activities cannot be listed', async () => {
    asStaff();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Event, 'findAll').mockRejectedValue(new Error('boom'));

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(Object.values(body.totals)).toEqual([null, null, null, null, null, null]);
    expect(body.eventsTotal).toBeNull();
  });

  it('carries counts only: no name, e-mail, phone or document', async () => {
    seed();

    const { body } = await request(app).get('/api/admin/report').set(auth);

    expect(JSON.stringify(body)).not.toMatch(/email|phone|cpf|guardian|name"/i);
  });
});

describe('GET /api/admin/report/csv', () => {
  it('downloads every activity of the window in a spreadsheet Excel opens in Portuguese, with a total, zero where nobody signed up', async () => {
    asStaff();
    const events = Array.from({ length: 7 }, (_, i) => ev(`e${i}`, i === 0 ? '=HYPERLINK("http://x")' : `Atividade ${i}`, new Date(Date.now() - (i + 1) * DAY)));
    jest.spyOn(Event, 'findAll').mockResolvedValue(events);
    jest.spyOn(Registration, 'findAll').mockResolvedValue(events.slice(0, 6).map((event) => group(event.id, true, false, 2)) as never);

    const response = await request(app).get('/api/admin/report/csv?period=month').set(auth);

    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toMatch(/^attachment; filename="relatorio-[a-z0-9-]+\.csv"$/);
    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines[0]).toMatch(/^Relatório — /);
    expect(lines[2]).toBe('Atividade;Data;Inscritos;Vieram;Faltaram;Sem conferir');
    expect(lines).toHaveLength(2 + 1 + 7 + 1);
    expect(lines[3]).toMatch(/^"'=HYPERLINK\(""http:\/\/x""\)";/);
    expect(lines[9]).toMatch(/^Atividade 6;\d\d\/\d\d\/\d{4};0;0;0;0$/);
    expect(lines.at(-1)).toBe('Total;;12;12;0;0');
  });

  it('writes a dash, not a zero, where the count failed', async () => {
    asStaff();
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    jest.spyOn(Event, 'findAll').mockResolvedValue([ev('e1', 'Oficina', new Date(Date.now() - DAY))]);
    jest.spyOn(Registration, 'findAll').mockRejectedValue(new Error('boom'));

    const lines = (await request(app).get('/api/admin/report/csv').set(auth)).text.replace('﻿', '').trim().split('\r\n');

    expect(lines[3]).toMatch(/^Oficina;\d\d\/\d\d\/\d{4};—;—;—;—$/);
    expect(lines.at(-1)).toBe('Total;;—;—;—;—');
  });
});
