import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Event, RefreshToken, sequelize, User } from '../../src/models';

const app = createApp();

const ACCOUNT = {
  name: 'Ana Souza',
  email: 'ana@exemplo.com',
  phone: null,
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
};

const EVENT = {
  title: 'Contação de histórias',
  description: 'Uma tarde de histórias.',
  category: 'Contação',
  startsAt: '2030-11-20T15:00',
  endsAt: '2030-11-20T17:00',
  location: 'Casa Verde',
  ageRange: 'A partir de 10 anos',
  capacity: 30,
  requiresCpf: true,
};

async function signUp(overrides: Record<string, unknown> = {}) {
  const response = await request(app).post('/api/auth/register').send({ ...ACCOUNT, ...overrides });
  return { token: response.body.token as string, id: response.body.user.id as string };
}

async function staff() {
  const account = await signUp();
  await User.update({ isStaff: true }, { where: { id: account.id } });
  return { Authorization: `Bearer ${account.token}` };
}

const publicTitles = async (period: 'upcoming' | 'past' = 'upcoming') =>
  (await request(app).get(`/api/events?period=${period}`)).body.data.map((event: { title: string }) => event.title);

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Event.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('event administration against a real MySQL', () => {
  it('lets in only people the database marks as staff: sign-up with hostile fields is not enough', async () => {
    const hostile = await signUp({ isStaff: true, is_staff: true, role: 'admin' });

    const response = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${hostile.token}`);

    expect(response.status).toBe(403);
  });

  it('opens once the account is promoted in the database, on the very next request', async () => {
    const account = await signUp();
    const header = { Authorization: `Bearer ${account.token}` };
    expect((await request(app).get('/api/admin/events').set(header)).status).toBe(403);

    await User.update({ isStaff: true }, { where: { id: account.id } });

    expect((await request(app).get('/api/admin/events').set(header)).status).toBe(200);
  });

  it('shuts again when staff access is taken away, even with a token still valid', async () => {
    const account = await signUp();
    await User.update({ isStaff: true }, { where: { id: account.id } });
    const header = { Authorization: `Bearer ${account.token}` };
    expect((await request(app).get('/api/admin/events').set(header)).status).toBe(200);

    await User.update({ isStaff: false }, { where: { id: account.id } });

    expect((await request(app).get('/api/admin/events').set(header)).status).toBe(403);
  });

  it('saves a draft that the public agenda does not show', async () => {
    const header = await staff();

    const created = await request(app).post('/api/admin/events').set(header).send(EVENT);

    expect(created.status).toBe(201);
    expect(created.body.event.published).toBe(false);
    expect(await publicTitles()).toEqual([]);
    expect((await request(app).get('/api/admin/events').set(header)).body.data).toHaveLength(1);
  });

  it('stores the São Paulo wall clock as UTC, and the public agenda returns that instant', async () => {
    const header = await staff();
    const created = await request(app).post('/api/admin/events').set(header).send(EVENT);
    await request(app).patch(`/api/admin/events/${created.body.event.id}/publication`).set(header).send({ published: true });

    const row = await Event.findByPk(created.body.event.id);
    expect(row?.startsAt.toISOString()).toBe('2030-11-20T18:00:00.000Z');
    const listed = (await request(app).get('/api/events?period=upcoming')).body.data[0];
    expect(listed.startsAt).toBe('2030-11-20T18:00:00.000Z');
    expect(listed.endsAt).toBe('2030-11-20T20:00:00.000Z');
  });

  it('publishes and takes down in a separate gesture, and the agenda follows each time', async () => {
    const header = await staff();
    const { id } = (await request(app).post('/api/admin/events').set(header).send(EVENT)).body.event;

    await request(app).patch(`/api/admin/events/${id}/publication`).set(header).send({ published: true });
    expect(await publicTitles()).toEqual(['Contação de histórias']);

    await request(app).patch(`/api/admin/events/${id}/publication`).set(header).send({ published: false });
    expect(await publicTitles()).toEqual([]);
  });

  it('editing a published event keeps it published, and the public sees the correction', async () => {
    const header = await staff();
    const { id } = (await request(app).post('/api/admin/events').set(header).send(EVENT)).body.event;
    await request(app).patch(`/api/admin/events/${id}/publication`).set(header).send({ published: true });

    const edited = await request(app).put(`/api/admin/events/${id}`).set(header).send({ ...EVENT, title: 'Contação de histórias — nova data', published: false });

    expect(edited.body.event.published).toBe(true);
    expect(await publicTitles()).toEqual(['Contação de histórias — nova data']);
  });

  it('keeps the document requirement and the capacity, and defaults them when absent', async () => {
    const header = await staff();
    const full = (await request(app).post('/api/admin/events').set(header).send(EVENT)).body.event;
    const bare = (await request(app).post('/api/admin/events').set(header).send({ title: 'Mínimo', startsAt: '2030-12-01T10:00' })).body.event;

    expect(full).toMatchObject({ requiresCpf: true, capacity: 30 });
    expect(bare).toMatchObject({ requiresCpf: false, capacity: null, endsAt: null, description: null });
  });

  it('keeps accents and emoji in what staff writes', async () => {
    const header = await staff();

    const created = await request(app).post('/api/admin/events').set(header).send({ ...EVENT, title: 'Café com memória 🌍', location: 'Praça da Sé' });

    const row = await Event.findByPk(created.body.event.id);
    expect(row?.title).toBe('Café com memória 🌍');
    expect(row?.location).toBe('Praça da Sé');
  });

  it('cannot delete an event: there is no route, and the row survives', async () => {
    const header = await staff();
    const { id } = (await request(app).post('/api/admin/events').set(header).send(EVENT)).body.event;

    expect((await request(app).delete(`/api/admin/events/${id}`).set(header)).status).toBe(404);
    expect(await Event.count()).toBe(1);
  });

  it('refuses an end before the start before it reaches the database', async () => {
    const header = await staff();

    const response = await request(app).post('/api/admin/events').set(header).send({ ...EVENT, endsAt: '2030-11-20T10:00' });

    expect(response.status).toBe(400);
    expect(await Event.count()).toBe(0);
  });

  it('refuses a zero capacity at the API and at the database', async () => {
    const header = await staff();
    expect((await request(app).post('/api/admin/events').set(header).send({ ...EVENT, capacity: 0 })).status).toBe(400);

    await expect(Event.create({ title: 'x', startsAt: new Date(), capacity: 0 } as never)).rejects.toThrow();
  });
});
