import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Event, RefreshToken, Registration, sequelize, User } from '../../src/models';

const app = createApp();

const FUTURE = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

const person = (n: number, overrides: Record<string, unknown> = {}) => ({
  name: `Pessoa ${n}`,
  email: `pessoa${n}@exemplo.com`,
  isMinor: false,
  imageAuthorized: false,
  consent: true,
  ...overrides,
});

async function makeEvent(overrides: Record<string, unknown> = {}) {
  return Event.create({
    title: 'Contação de histórias',
    startsAt: FUTURE,
    published: true,
    ...overrides,
  } as never);
}

const signUp = (eventId: string, body: object, token?: string, ip?: string) => {
  const req = request(app).post(`/api/events/${eventId}/registrations`);
  if (token) req.set('Authorization', `Bearer ${token}`);
  if (ip) req.set('X-Forwarded-For', ip);
  return req.send(body);
};

async function account(email = 'ana@exemplo.com') {
  const response = await request(app).post('/api/auth/register').send({
    name: 'Ana Souza',
    email,
    personType: 'individual',
    password: 'uma-senha-boa',
    wantsToVolunteer: true,
    confirmsAdult: true,
    consent: true,
  });
  return { token: response.body.token as string, id: response.body.user.id as string };
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Registration.destroy({ where: {} });
  await Event.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('event registration against a real MySQL', () => {
  it('signs up without an account and counts the spot in the public agenda', async () => {
    const event = await makeEvent({ capacity: 10 });

    const response = await signUp(event.id, person(1));

    expect(response.status).toBe(201);
    expect(response.body.event.spotsLeft).toBe(9);
    const listed = (await request(app).get('/api/events?period=upcoming')).body.data[0];
    expect(listed.spotsLeft).toBe(9);
    const row = await Registration.findOne({ where: { eventId: event.id } });
    expect(row).toMatchObject({ userId: null, name: 'Pessoa 1', email: 'pessoa1@exemplo.com', cpf: null, isMinor: false, imageAuthorized: false });
    expect(row?.consentedAt).toBeInstanceOf(Date);
  });

  it('gives the last spot to exactly one of several people sending at the same time', async () => {
    const event = await makeEvent({ capacity: 1 });

    const responses = await Promise.all([1, 2, 3, 4, 5].map((n) => signUp(event.id, person(n))));

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses).toEqual([201, 409, 409, 409, 409]);
    expect(responses.filter((r) => r.status === 409).every((r) => r.body.error.code === 'event_full')).toBe(true);
    expect(await Registration.count({ where: { eventId: event.id } })).toBe(1);
  });

  it('never goes over the capacity with a crowd, and fills it exactly', async () => {
    const event = await makeEvent({ capacity: 4 });

    const responses = await Promise.all(Array.from({ length: 12 }, (_, i) => signUp(event.id, person(i + 1))));

    expect(responses.filter((r) => r.status === 201)).toHaveLength(4);
    expect(responses.filter((r) => r.status === 409)).toHaveLength(8);
    expect(await Registration.count({ where: { eventId: event.id } })).toBe(4);
    expect((await request(app).get(`/api/events/${event.id}`)).body.event).toMatchObject({ spotsLeft: 0, registrationsOpen: false });
  });

  it('lets only one of two identical simultaneous sign-ups through', async () => {
    const event = await makeEvent();

    const responses = await Promise.all([signUp(event.id, person(1)), signUp(event.id, person(1))]);

    expect(responses.map((r) => r.status).sort()).toEqual([201, 409]);
    expect(await Registration.count()).toBe(1);
  });

  it('treats the same name in another case or without accents as the same person', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1, { name: 'José da Conceição' }));

    const again = await signUp(event.id, person(1, { name: 'jose da conceicao' }));

    expect(again.status).toBe(409);
    expect(again.body.error.code).toBe('already_registered');
  });

  it('lets one address sign up different people, up to five, and then stops', async () => {
    const event = await makeEvent();

    const results = [];
    for (let n = 1; n <= 6; n += 1) {
      results.push((await signUp(event.id, person(n, { email: 'familia@exemplo.com' }))).status);
    }

    expect(results).toEqual([201, 201, 201, 201, 201, 429]);
  });

  it('stores a minor with the guardian, and the database itself refuses a minor without one', async () => {
    const event = await makeEvent();

    const ok = await signUp(event.id, person(1, { isMinor: true, guardianName: 'Maria Souza', guardianPhone: '(11) 91234-5678' }));
    expect(ok.status).toBe(201);
    expect(await Registration.findOne({ where: { eventId: event.id } })).toMatchObject({
      isMinor: true,
      guardianName: 'Maria Souza',
      guardianPhone: '11912345678',
    });

    await expect(
      Registration.create({
        eventId: event.id,
        name: 'Criança',
        email: 'c@exemplo.com',
        isMinor: true,
        consentedAt: new Date(),
      } as never),
    ).rejects.toThrow();
  });

  it('asks for the CPF only when the event does, stores digits, and the database refuses a malformed one', async () => {
    const withCpf = await makeEvent({ title: 'Com CPF', requiresCpf: true });
    const without = await makeEvent({ title: 'Sem CPF', requiresCpf: false });

    expect((await signUp(withCpf.id, person(1))).status).toBe(400);
    expect((await signUp(withCpf.id, person(1, { cpf: '111.111.111-11' }))).status).toBe(400);
    expect((await signUp(withCpf.id, person(1, { cpf: '529.982.247-25' }))).status).toBe(201);
    expect((await Registration.findOne({ where: { eventId: withCpf.id } }))?.cpf).toBe('52998224725');
    expect((await signUp(without.id, person(1, { cpf: '529.982.247-25' }))).status).toBe(201);
    expect((await Registration.findOne({ where: { eventId: without.id } }))?.cpf).toBeNull();

    await expect(
      Registration.create({ eventId: without.id, name: 'X', email: 'x@exemplo.com', cpf: '123', consentedAt: new Date() } as never),
    ).rejects.toThrow();
  });

  it('refuses a draft, an event that is over and a missing event, and writes nothing', async () => {
    const draft = await makeEvent({ published: false });
    const over = await makeEvent({ startsAt: new Date('2020-01-01T10:00:00Z') });

    expect((await signUp(draft.id, person(1))).status).toBe(404);
    expect((await signUp(over.id, person(1))).body.error.code).toBe('registrations_closed');
    expect((await signUp('22222222-2222-4222-8222-222222222222', person(1))).status).toBe(404);
    expect(await Registration.count()).toBe(0);
  });

  it('links the sign-up to the account, and keeps it when the account goes away', async () => {
    const event = await makeEvent();
    const ana = await account();

    expect((await signUp(event.id, person(1, { email: 'ana@exemplo.com', userId: 'x' }), ana.token)).status).toBe(201);
    const row = await Registration.findOne({ where: { eventId: event.id } });
    expect(row?.userId).toBe(ana.id);

    await User.destroy({ where: { id: ana.id } });
    const after = await Registration.findOne({ where: { eventId: event.id } });
    expect(after).not.toBeNull();
    expect(after?.userId).toBeNull();
  });

  it('accepts a signed-in person for somebody else, still linked to the account that sent it', async () => {
    const event = await makeEvent();
    const ana = await account();

    const response = await signUp(event.id, person(1, { name: 'Filho da Ana', isMinor: true, guardianName: 'Ana Souza', guardianPhone: '(11) 95396-8344' }), ana.token);

    expect(response.status).toBe(201);
    expect((await Registration.findOne({ where: { eventId: event.id } }))?.userId).toBe(ana.id);
  });

  it('answers 401 for a bad token instead of treating the person as a visitor', async () => {
    const event = await makeEvent();

    expect((await signUp(event.id, person(1), 'um.token.ruim')).status).toBe(401);
    expect(await Registration.count()).toBe(0);
  });

  it('cannot delete an event that has sign-ups: the sign-ups are a record', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));

    await expect(Event.destroy({ where: { id: event.id } })).rejects.toThrow();
    expect(await Event.count()).toBe(1);
    expect(await Registration.count()).toBe(1);
  });

  it('keeps accents and emoji in the name', async () => {
    const event = await makeEvent();

    await signUp(event.id, person(1, { name: 'Zuleica Conceição 🌍' }));

    expect((await Registration.findOne({ where: { eventId: event.id } }))?.name).toBe('Zuleica Conceição 🌍');
  });

  it('does not read personal data back through any public route', async () => {
    const event = await makeEvent({ capacity: 5 });
    await signUp(event.id, person(1, { phone: '(11) 95396-8344' }));

    const bodies = JSON.stringify([
      (await request(app).get('/api/events')).body,
      (await request(app).get(`/api/events/${event.id}`)).body,
    ]);

    expect(bodies).not.toMatch(/pessoa1|95396|guardian|email/i);
  });
});

describe('the limit per connection', () => {
  it('stops the thirty-first sign-up from one connection in an hour, while another connection still gets in', async () => {
    const event = await makeEvent();

    const statuses: number[] = [];
    for (let n = 1; n <= 31; n += 1) {
      statuses.push((await signUp(event.id, person(n), undefined, '203.0.113.7')).status);
    }
    const blocked = await signUp(event.id, person(32), undefined, '203.0.113.7');
    const elsewhere = await signUp(event.id, person(33), undefined, '198.51.100.9');

    expect(statuses.slice(0, 30).every((status) => status === 201)).toBe(true);
    expect(statuses[30]).toBe(429);
    expect(blocked.body.error.code).toBe('too_many_requests');
    expect(elsewhere.status).toBe(201);
  });

  it('counts only the last hour', async () => {
    const event = await makeEvent();
    for (let n = 1; n <= 30; n += 1) await signUp(event.id, person(n), undefined, '203.0.113.7');
    await sequelize.query('update registrations set created_at = created_at - interval 2 hour');

    const response = await signUp(event.id, person(99), undefined, '203.0.113.7');

    expect(response.status).toBe(201);
  });

  it('keeps a keyed hash of the connection and never the address', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1), undefined, '203.0.113.7');

    const row = await Registration.findOne({ where: { eventId: event.id } });
    const [stored] = (await sequelize.query('select * from registrations', { type: 'SELECT' })) as Array<Record<string, unknown>>;

    expect(row?.originHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(stored)).not.toContain('203.0.113.7');
  });

  it('treats every address of the same IPv6 /64 as one connection', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1), undefined, '2001:db8:aaaa:bbbb:1::1');
    await signUp(event.id, person(2), undefined, '2001:db8:aaaa:bbbb:ffff::2');

    const hashes = (await Registration.findAll({ where: { eventId: event.id } })).map((row) => row.originHash);

    expect(new Set(hashes).size).toBe(1);
  });
});

describe('what the staff sees about sign-ups', () => {
  it('counts the registrations of each event in the panel list', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));
    await signUp(event.id, person(2));
    const staff = await account('equipe@exemplo.com');
    await User.update({ isStaff: true }, { where: { id: staff.id } });

    const list = await request(app).get('/api/admin/events').set('Authorization', `Bearer ${staff.token}`);

    expect(list.body.data[0]).toMatchObject({ id: event.id, registrationCount: 2 });
  });
});

describe('RF16: the list and the spreadsheet of registrants', () => {
  async function staffHeader() {
    const staff = await account('equipe@exemplo.com');
    await User.update({ isStaff: true }, { where: { id: staff.id } });
    return { Authorization: `Bearer ${staff.token}` };
  }

  it('lists everyone in order of arrival with the image authorization of each one', async () => {
    const event = await makeEvent({ requiresCpf: true });
    await signUp(event.id, person(1, { cpf: '529.982.247-25', imageAuthorized: true, phone: '(11) 95396-8344' }));
    await signUp(event.id, person(2, { cpf: '111.444.777-35', isMinor: true, guardianName: 'Maria', guardianPhone: '11 91234-5678' }));
    const header = await staffHeader();

    const response = await request(app).get(`/api/admin/events/${event.id}/registrations`).set(header);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toMatch(/no-store/);
    expect(response.body.event.id).toBe(event.id);
    expect(response.body.data.map((r: { name: string }) => r.name)).toEqual(['Pessoa 1', 'Pessoa 2']);
    expect(response.body.data[0]).toMatchObject({ cpf: '52998224725', imageAuthorized: true, phone: '11953968344', hasAccount: false });
    expect(response.body.data[1]).toMatchObject({ isMinor: true, guardianName: 'Maria', imageAuthorized: false });
    expect(JSON.stringify(response.body)).not.toMatch(/originHash|origin_hash|userId/);
  });

  it('shows a draft event too, and answers 404 for one that does not exist', async () => {
    const draft = await makeEvent({ published: false });
    const header = await staffHeader();

    expect((await request(app).get(`/api/admin/events/${draft.id}/registrations`).set(header)).status).toBe(200);
    const missing = await request(app).get('/api/admin/events/3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10/registrations').set(header);
    expect(missing.status).toBe(404);
  });

  it.each(['', '.csv'])('refuses without a session (401) and to a common account (403) on the route%s', async (suffix) => {
    const event = await makeEvent();
    await signUp(event.id, person(1));
    const common = await account('comum@exemplo.com');

    const anonymous = await request(app).get(`/api/admin/events/${event.id}/registrations${suffix}`);
    const refused = await request(app).get(`/api/admin/events/${event.id}/registrations${suffix}`).set('Authorization', `Bearer ${common.token}`);

    expect(anonymous.status).toBe(401);
    expect(refused.status).toBe(403);
    expect(refused.text).not.toContain('Pessoa 1');
  });

  it('downloads a spreadsheet Excel opens in Portuguese, neutralizing formulas', async () => {
    const event = await makeEvent({ title: 'Cafú e o Café' });
    await signUp(event.id, person(1, { name: '=HYPERLINK("http://x")', imageAuthorized: true }));
    await signUp(event.id, person(2, { name: 'José; "Zé" Conceição' }));
    const header = await staffHeader();

    const response = await request(app).get(`/api/admin/events/${event.id}/registrations.csv`).set(header).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });

    const bytes = response.body as Buffer;
    expect(response.headers['content-type']).toContain('text/csv');
    expect(response.headers['content-disposition']).toBe('attachment; filename="inscritos-cafu-e-o-cafe.csv"');
    expect([...bytes.subarray(0, 3)]).toEqual([0xef, 0xbb, 0xbf]);
    const text = bytes.toString('utf8').slice(1);
    const lines = text.split('\r\n');
    expect(lines[0]).toBe('Nome;Autorizou imagem;Menor de idade;Responsável;Telefone do responsável;E-mail;Telefone;CPF;Tem conta;Inscrito em;Presença');
    expect(lines[1]).toMatch(/^"'=HYPERLINK\(""http:\/\/x""\)";Sim;Não;/);
    expect(lines[2]).toMatch(/^"José; ""Zé"" Conceição";Não;/);
  });

  it('has no way to change or delete a registration through these routes', async () => {
    const event = await makeEvent();
    const header = await staffHeader();

    for (const method of ['post', 'put', 'patch', 'delete'] as const) {
      const response = await request(app)[method](`/api/admin/events/${event.id}/registrations`).set(header);
      expect(response.status).toBe(404);
    }
  });
});

describe('RF17: the attendance list', () => {
  async function staffHeader() {
    const staff = await account('equipe@exemplo.com');
    await User.update({ isStaff: true }, { where: { id: staff.id } });
    return { Authorization: `Bearer ${staff.token}` };
  }

  it('starts every registration as "not checked", not as absent', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));

    expect((await Registration.findOne({ where: { eventId: event.id } }))?.attended).toBeNull();
    const header = await staffHeader();
    const list = await request(app).get(`/api/admin/events/${event.id}/attendance`).set(header);
    expect(list.body.data[0].attended).toBeNull();
  });

  it('lists by name, ignoring case and accents, with only what the door needs', async () => {
    const event = await makeEvent();
    for (const name of ['Zélia', 'ana', 'Álvaro', 'Bia']) await signUp(event.id, person(Math.random() * 1e6 | 0, { name }));
    const header = await staffHeader();

    const { body } = await request(app).get(`/api/admin/events/${event.id}/attendance`).set(header);

    expect(body.data.map((entry: { name: string }) => entry.name)).toEqual(['Álvaro', 'ana', 'Bia', 'Zélia']);
    expect(Object.keys(body.data[0]).sort()).toEqual(['attended', 'id', 'isMinor', 'name']);
  });

  it('marks came, did not come, and back to not checked, each persisted', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));
    const header = await staffHeader();
    const { id } = (await Registration.findOne({ where: { eventId: event.id } }))!;
    const mark = (attended: boolean | null) =>
      request(app).patch(`/api/admin/events/${event.id}/attendance/${id}`).set(header).send({ attended });

    expect((await mark(true)).body.registration.attended).toBe(true);
    expect((await Registration.findByPk(id))?.attended).toBe(true);
    expect((await mark(false)).body.registration.attended).toBe(false);
    expect((await Registration.findByPk(id))?.attended).toBe(false);
    expect((await mark(null)).body.registration.attended).toBeNull();
    expect((await Registration.findByPk(id))?.attended).toBeNull();
  });

  it('does not let a registration of one event be marked through another event', async () => {
    const first = await makeEvent();
    const second = await makeEvent({ title: 'Outro' });
    await signUp(first.id, person(1));
    const { id } = (await Registration.findOne({ where: { eventId: first.id } }))!;
    const header = await staffHeader();

    const response = await request(app).patch(`/api/admin/events/${second.id}/attendance/${id}`).set(header).send({ attended: true });

    expect(response.status).toBe(404);
    expect((await Registration.findByPk(id))?.attended).toBeNull();
  });

  it('refuses a common account and an anonymous caller, and writes nothing', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));
    const { id } = (await Registration.findOne({ where: { eventId: event.id } }))!;
    const common = await account('comum@exemplo.com');
    const url = `/api/admin/events/${event.id}/attendance/${id}`;

    expect((await request(app).patch(url).send({ attended: true })).status).toBe(401);
    expect((await request(app).patch(url).set('Authorization', `Bearer ${common.token}`).send({ attended: true })).status).toBe(403);
    expect((await Registration.findByPk(id))?.attended).toBeNull();
  });

  it('shows the mark in the spreadsheet', async () => {
    const event = await makeEvent();
    await signUp(event.id, person(1));
    const { id } = (await Registration.findOne({ where: { eventId: event.id } }))!;
    const header = await staffHeader();
    await request(app).patch(`/api/admin/events/${event.id}/attendance/${id}`).set(header).send({ attended: true });

    const list = await request(app).get(`/api/admin/events/${event.id}/registrations`).set(header);
    expect(list.body.data[0].attended).toBe(true);
    const csv = await request(app).get(`/api/admin/events/${event.id}/registrations.csv`).set(header);
    expect(csv.text.trim().split('\r\n')[1]?.split(';').at(-1)).toBe('Veio');
  });
});

describe('RF11: my registrations', () => {
  it('lists only the sign-ups tied to the account, never another person\'s', async () => {
    const event = await makeEvent();
    const ana = await account('ana@exemplo.com');
    const bia = await account('bia@exemplo.com');
    await signUp(event.id, person(1, { name: 'Ana Souza' }), ana.token);
    await signUp(event.id, person(2, { name: 'Filho da Ana' }), ana.token);
    await signUp(event.id, person(3, { name: 'Bia Lima' }), bia.token);
    await signUp(event.id, person(4, { name: 'Sem conta' }));

    const mine = await request(app).get('/api/me/registrations').set('Authorization', `Bearer ${ana.token}`);
    const hers = await request(app).get('/api/me/registrations').set('Authorization', `Bearer ${bia.token}`);

    expect(mine.status).toBe(200);
    expect(mine.body.data.map((entry: { name: string }) => entry.name).sort()).toEqual(['Ana Souza', 'Filho da Ana']);
    expect(hers.body.data.map((entry: { name: string }) => entry.name)).toEqual(['Bia Lima']);
    expect(JSON.stringify(mine.body)).not.toMatch(/Bia|Sem conta|pessoa\d@/);
  });

  it('reports whether the event is over and whether attendance was recorded', async () => {
    const past = await makeEvent({ title: 'Passado', startsAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000) });
    const next = await makeEvent({ title: 'Próximo' });
    const ana = await account('ana@exemplo.com');
    await signUp(next.id, person(1), ana.token);
    await Registration.create({
      eventId: past.id,
      userId: ana.id,
      name: 'Ana Souza',
      email: 'ana@exemplo.com',
      consentedAt: new Date(),
      attended: true,
    } as never);

    const { body } = await request(app).get('/api/me/registrations').set('Authorization', `Bearer ${ana.token}`);

    expect(body.data.map((entry: { event: { title: string } }) => entry.event.title)).toEqual(['Passado', 'Próximo']);
    expect(body.data[0]).toMatchObject({ attendanceRecorded: true, event: { isOver: true } });
    expect(body.data[1]).toMatchObject({ attendanceRecorded: false, event: { isOver: false } });
  });

  it('answers 401 without a session', async () => {
    expect((await request(app).get('/api/me/registrations')).status).toBe(401);
  });
});
