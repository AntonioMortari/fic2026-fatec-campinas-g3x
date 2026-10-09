import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Event, RefreshToken, Registration, sequelize, User } from '../../src/models';
import { reportRange } from '../../src/utils/report-period';

const app = createApp();
const RANGE = reportRange('month', -1);

async function staffHeader() {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Equipe', email: 'equipe@exemplo.com', personType: 'individual', password: 'uma-senha-boa',
    wantsToVolunteer: true, confirmsAdult: true, consent: true,
  });
  await User.update({ isStaff: true }, { where: { id: response.body.user.id } });
  return { Authorization: `Bearer ${response.body.token}` };
}

const makeEvent = (title: string, startsAt: Date, overrides: Record<string, unknown> = {}) =>
  Event.create({ title, startsAt, published: true, ...overrides } as never);

let counter = 0;
async function sign(eventId: string, attended: boolean | null, overrides: Record<string, unknown> = {}) {
  counter += 1;
  return Registration.create({
    eventId, name: `Pessoa ${counter}`, email: `p${counter}@exemplo.com`, consentedAt: new Date(), attended, ...overrides,
  } as never);
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  counter = 0;
  await Registration.destroy({ where: {} });
  await Event.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

const day = (n: number) => new Date(RANGE.from.getTime() + n * 24 * 60 * 60 * 1000);

describe('the report against a real MySQL (RF30–32, designs 7i and 7j)', () => {
  it('counts came, missed and not checked apart, and the minors who came', async () => {
    const header = await staffHeader();
    const event = await makeEvent('Oficina de tambores', day(3));
    for (let i = 0; i < 3; i += 1) await sign(event.id, true);
    await sign(event.id, true, { isMinor: true, guardianName: 'Maria', guardianPhone: '11912345678' });
    await sign(event.id, false);
    await sign(event.id, false, { isMinor: true, guardianName: 'Maria', guardianPhone: '11912345678' });
    await sign(event.id, null);
    await sign(event.id, null);

    const { body } = await request(app).get('/api/admin/report?period=month&offset=-1').set(header);

    expect(body.label).toBe(RANGE.label);
    expect(body.totals).toEqual({ activities: 1, registered: 8, attended: 4, missed: 2, unchecked: 2, minorsAttended: 1 });
    expect(body.events[0]).toMatchObject({ title: 'Oficina de tambores', registered: 8, attended: 4, missed: 2, unchecked: 2 });
  });

  it('leaves the cancelled sign-ups out of every number', async () => {
    const header = await staffHeader();
    const event = await makeEvent('Roda', day(3));
    await sign(event.id, true);
    await sign(event.id, true, { cancelledAt: new Date() });
    await sign(event.id, null, { cancelledAt: new Date() });

    const { body } = await request(app).get('/api/admin/report?offset=-1').set(header);

    expect(body.totals).toMatchObject({ registered: 1, attended: 1, unchecked: 0 });
  });

  it('puts an activity at the very start of the month inside, at the very start of the next one outside, and a millisecond before outside', async () => {
    const header = await staffHeader();
    await makeEvent('No primeiro instante', RANGE.from);
    await makeEvent('Um instante antes', new Date(RANGE.from.getTime() - 1));
    await makeEvent('No primeiro instante do mês seguinte', RANGE.to);

    const { body } = await request(app).get('/api/admin/report?offset=-1').set(header);

    expect(body.events.map((row: { title: string }) => row.title)).toEqual(['No primeiro instante']);
  });

  it('ignores drafts, and activities that have not happened yet', async () => {
    const header = await staffHeader();
    await makeEvent('Rascunho', day(2), { published: false });
    await makeEvent('Ainda vem', new Date(Date.now() + 5 * 24 * 60 * 60 * 1000));
    await makeEvent('Aconteceu', day(2));

    const current = await request(app).get('/api/admin/report?offset=0').set(header);
    const previous = await request(app).get('/api/admin/report?offset=-1').set(header);

    expect(current.body.events.map((row: { title: string }) => row.title)).not.toContain('Ainda vem');
    expect(previous.body.events.map((row: { title: string }) => row.title)).toEqual(['Aconteceu']);
  });

  it('lists the five most recent and counts all of them', async () => {
    const header = await staffHeader();
    for (let i = 1; i <= 7; i += 1) {
      const event = await makeEvent(`Atividade ${i}`, day(i));
      await sign(event.id, true);
    }

    const { body } = await request(app).get('/api/admin/report?offset=-1').set(header);

    expect(body.events.map((row: { title: string }) => row.title)).toEqual(['Atividade 7', 'Atividade 6', 'Atividade 5', 'Atividade 4', 'Atividade 3']);
    expect(body.eventsTotal).toBe(7);
    expect(body.totals).toMatchObject({ activities: 7, registered: 7, attended: 7 });
  });

  it('a window of three months covers three months, and the previous one does not repeat them', async () => {
    const header = await staffHeader();
    const quarter = reportRange('quarter', -1);
    const previousQuarter = reportRange('quarter', -2);
    await makeEvent('Dentro', new Date(quarter.from.getTime() + 24 * 60 * 60 * 1000));
    await makeEvent('Do trimestre anterior', new Date(previousQuarter.from.getTime() + 24 * 60 * 60 * 1000));

    const inside = await request(app).get('/api/admin/report?period=quarter&offset=-1').set(header);
    const before = await request(app).get('/api/admin/report?period=quarter&offset=-2').set(header);

    expect(inside.body.events.map((row: { title: string }) => row.title)).toEqual(['Dentro']);
    expect(before.body.events.map((row: { title: string }) => row.title)).toEqual(['Do trimestre anterior']);
  });

  it('downloads every activity in the spreadsheet, not only the five', async () => {
    const header = await staffHeader();
    for (let i = 1; i <= 7; i += 1) await makeEvent(`Atividade ${i}`, day(i));

    const response = await request(app).get('/api/admin/report/csv?offset=-1').set(header);

    const lines = response.text.replace('﻿', '').trim().split('\r\n');
    expect(lines).toHaveLength(2 + 1 + 7 + 1);
    expect(lines.at(-1)).toBe('Total;;0;0;0;0');
  });

  it('refuses a common account and an anonymous caller', async () => {
    await staffHeader();
    const common = await request(app).post('/api/auth/register').send({
      name: 'Comum', email: 'comum@exemplo.com', personType: 'individual', password: 'uma-senha-boa', wantsToVolunteer: true, confirmsAdult: true, consent: true,
    });

    for (const path of ['/api/admin/report', '/api/admin/report/csv']) {
      expect((await request(app).get(path)).status).toBe(401);
      expect((await request(app).get(path).set('Authorization', `Bearer ${common.body.token}`)).status).toBe(403);
    }
  });
});
