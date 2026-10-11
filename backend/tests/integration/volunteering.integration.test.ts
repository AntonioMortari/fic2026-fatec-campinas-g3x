import { UniqueConstraintError } from 'sequelize';
import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { RefreshToken, sequelize, User, VolunteerApplication, VolunteerApplicationArea, VolunteerArea } from '../../src/models';

const app = createApp();

const account = (n: number, overrides: Record<string, unknown> = {}) => ({
  name: `Pessoa ${n}`,
  email: `pessoa${n}@exemplo.com`,
  phone: '11981234567',
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
  ...overrides,
});

async function signUp(n: number, overrides: Record<string, unknown> = {}) {
  const response = await request(app).post('/api/auth/register').send(account(n, overrides));
  return { token: response.body.token as string, id: response.body.user.id as string, headers: { Authorization: `Bearer ${response.body.token}` } };
}

async function staff() {
  const person = await signUp(900);
  await User.update({ isStaff: true }, { where: { id: person.id } });
  return person.headers;
}

const apply = (headers: Record<string, string>, body: object = { areas: ['comunicacao'] }) =>
  request(app).post('/api/volunteer-applications').set(headers).send(body);

const setStatus = (staffHeaders: Record<string, string>, id: string, status: string) =>
  request(app).patch(`/api/admin/volunteer-applications/${id}/status`).set(staffHeaders).send({ status });

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await VolunteerApplicationArea.destroy({ where: {} });
  await VolunteerApplication.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('the volunteer areas against a real MySQL', () => {
  it('come from the migration with the real text, in the order the staff defined', async () => {
    const response = await request(app).get('/api/volunteer-areas');

    expect(response.status).toBe(200);
    expect(response.body.data.map((area: { id: string }) => area.id)).toEqual(['apoio-pedagogico', 'comunicacao', 'producao-eventos', 'acervo', 'administrativo']);
    expect(response.body.data[0]).toEqual({
      id: 'apoio-pedagogico',
      name: 'Apoio pedagógico e oficinas',
      description: 'Reforço escolar, contação de histórias, oficinas de percussão, dança, turbantes e artes manuais.',
    });
    expect(response.body.data[3].description).toBe('Catalogação de livros, roupas, instrumentos musicais, fantasias e peças de memória ancestral.');
  });
});

describe('applying to volunteer against a real MySQL', () => {
  it('saves the application and its areas, tied to the account of the token', async () => {
    const person = await signUp(1);

    const response = await apply(person.headers, { areas: ['acervo', 'apoio-pedagogico'], message: 'Sábado de manhã, com acento e emoji 🙂.' });

    expect(response.status).toBe(201);
    const row = await VolunteerApplication.findOne({ where: { userId: person.id } });
    expect(row).toMatchObject({ status: 'new', message: 'Sábado de manhã, com acento e emoji 🙂.' });
    const links = await VolunteerApplicationArea.findAll({ where: { applicationId: row!.id }, order: [['areaId', 'ASC']] });
    expect(links.map((link) => link.areaId)).toEqual(['acervo', 'apoio-pedagogico']);
    expect(response.body.application.areas.map((area: { id: string }) => area.id)).toEqual(['apoio-pedagogico', 'acervo']);
  });

  it('ignores a hostile body: status, user id and a repeated area change nothing they should not', async () => {
    const person = await signUp(1);
    const other = await signUp(2);

    const response = await apply(person.headers, { areas: ['comunicacao', 'comunicacao'], status: 'volunteering', userId: other.id, user_id: other.id });

    expect(response.status).toBe(201);
    const rows = await VolunteerApplication.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ userId: person.id, status: 'new' });
    expect(await VolunteerApplicationArea.count()).toBe(1);
  });

  it('refuses an area that does not exist and saves nothing', async () => {
    const person = await signUp(1);

    const response = await apply(person.headers, { areas: ['comunicacao', 'inventada'] });

    expect(response.status).toBe(400);
    expect(await VolunteerApplication.count()).toBe(0);
    expect(await VolunteerApplicationArea.count()).toBe(0);
  });

  it('leaves no half application behind when saving the areas fails', async () => {
    const person = await signUp(1);
    const failing = jest.spyOn(VolunteerApplicationArea, 'bulkCreate').mockRejectedValueOnce(new Error('disk full'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await apply(person.headers, { areas: ['comunicacao', 'acervo'] });

    expect(failing).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(500);
    expect(await VolunteerApplication.count()).toBe(0);
    expect(await VolunteerApplicationArea.count()).toBe(0);
    jest.restoreAllMocks();
    expect((await apply(person.headers)).status).toBe(201);
  });

  it.each(['new', 'in_contact', 'volunteering'] as const)('refuses a second application while the first is %s', async (status) => {
    const person = await signUp(1);
    const headers = await staff();
    const first = await apply(person.headers);
    await setStatus(headers, first.body.application.id, status);

    const second = await apply(person.headers, { areas: ['acervo'] });

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('already_applied');
    expect(await VolunteerApplication.count({ where: { userId: person.id } })).toBe(1);
  });

  it('lets someone whose application ended apply again, keeping the old one as a record', async () => {
    const person = await signUp(1);
    const headers = await staff();
    const first = await apply(person.headers);
    await setStatus(headers, first.body.application.id, 'ended');

    const second = await apply(person.headers, { areas: ['acervo'] });

    expect(second.status).toBe(201);
    expect(await VolunteerApplication.count({ where: { userId: person.id } })).toBe(2);
    const mine = await request(app).get('/api/me/volunteer-applications').set(person.headers);
    expect(mine.body.data.map((entry: { status: string }) => entry.status)).toEqual(['new', 'ended']);
  });

  it('gives exactly one application to several submissions sent at the same time', async () => {
    const person = await signUp(1);

    const responses = await Promise.all(Array.from({ length: 8 }, () => apply(person.headers, { areas: ['comunicacao', 'acervo'] })));

    const statuses = responses.map((response) => response.status).sort();
    expect(statuses.filter((status) => status === 201)).toHaveLength(1);
    expect(statuses.filter((status) => status === 409)).toHaveLength(7);
    expect(await VolunteerApplication.count({ where: { userId: person.id } })).toBe(1);
    expect(await VolunteerApplicationArea.count()).toBe(2);
  });

  it('holds the rule in the database itself, not only in the service', async () => {
    const person = await signUp(1);
    await VolunteerApplication.create({ userId: person.id, status: 'new', message: null });

    await expect(VolunteerApplication.create({ userId: person.id, status: 'in_contact', message: null })).rejects.toBeInstanceOf(UniqueConstraintError);
    await expect(VolunteerApplication.create({ userId: person.id, status: 'ended', message: null })).resolves.toBeDefined();
    await expect(VolunteerApplication.create({ userId: person.id, status: 'ended', message: null })).resolves.toBeDefined();
  });

  it('does not let the database keep a link to an area that does not exist', async () => {
    const person = await signUp(1);
    const row = await VolunteerApplication.create({ userId: person.id, status: 'new', message: null });

    await expect(VolunteerApplicationArea.create({ applicationId: row.id, areaId: 'inventada' })).rejects.toThrow();
  });

  it('does not delete an area that applications point to', async () => {
    const person = await signUp(1);
    await apply(person.headers, { areas: ['acervo'] });

    await expect(VolunteerArea.destroy({ where: { id: 'acervo' } })).rejects.toThrow();
  });

  it('takes the applications of an account away with the account', async () => {
    const person = await signUp(1);
    await apply(person.headers, { areas: ['acervo', 'comunicacao'] });

    await User.destroy({ where: { id: person.id } });

    expect(await VolunteerApplication.count()).toBe(0);
    expect(await VolunteerApplicationArea.count()).toBe(0);
  });
});

describe('what each person can read of the applications', () => {
  it('shows each account only its own applications', async () => {
    const ana = await signUp(1);
    const bia = await signUp(2);
    await apply(ana.headers, { areas: ['acervo'], message: 'Mensagem da Ana' });
    await apply(bia.headers, { areas: ['comunicacao'], message: 'Mensagem da Bia' });

    const anasList = (await request(app).get('/api/me/volunteer-applications').set(ana.headers)).body.data;
    const biasList = (await request(app).get(`/api/me/volunteer-applications?userId=${ana.id}`).set(bia.headers)).body.data;

    expect(anasList).toHaveLength(1);
    expect(anasList[0].message).toBe('Mensagem da Ana');
    expect(biasList).toHaveLength(1);
    expect(biasList[0].message).toBe('Mensagem da Bia');
    expect(JSON.stringify(biasList)).not.toContain('Ana');
  });

  it('keeps the ended application at the bottom of the list, never dropping it', async () => {
    const person = await signUp(1);
    const headers = await staff();
    const first = await apply(person.headers, { areas: ['producao-eventos'] });
    await setStatus(headers, first.body.application.id, 'ended');
    await apply(person.headers, { areas: ['acervo'] });

    const { body } = await request(app).get('/api/me/volunteer-applications').set(person.headers);

    expect(body.data.map((entry: { status: string }) => entry.status)).toEqual(['new', 'ended']);
    expect(body.data[1].areas).toEqual([{ id: 'producao-eventos', name: 'Produção de eventos' }]);
  });

  it('refuses everything of the staff queue to a plain account', async () => {
    const person = await signUp(1);
    const created = await apply(person.headers);
    const id = created.body.application.id as string;

    const attempts = await Promise.all([
      request(app).get('/api/admin/volunteer-applications').set(person.headers),
      request(app).get('/api/admin/volunteer-applications/counts').set(person.headers),
      request(app).get('/api/admin/volunteer-applications/export.csv').set(person.headers),
      request(app).get(`/api/admin/volunteer-applications/${id}`).set(person.headers),
      setStatus(person.headers, id, 'volunteering'),
    ]);

    expect(attempts.map((response) => response.status)).toEqual([403, 403, 403, 403, 403]);
    expect((await VolunteerApplication.findByPk(id))?.status).toBe('new');
  });
});

describe('the staff queue against a real MySQL', () => {
  async function queue() {
    const headers = await staff();
    const people = await Promise.all([signUp(1, { name: 'Thiago Ramos' }), signUp(2, { name: 'Larissa Mendes' }), signUp(3, { name: 'Fernanda Oliveira' }), signUp(4, { name: 'Denise Costa', phone: null })]);
    const thiago = await apply(people[0]!.headers, { areas: ['producao-eventos'] });
    const larissa = await apply(people[1]!.headers, { areas: ['apoio-pedagogico', 'comunicacao'], message: 'Manhãs de sábado.' });
    const fernanda = await apply(people[2]!.headers, { areas: ['acervo', 'administrativo'] });
    const denise = await apply(people[3]!.headers, { areas: ['producao-eventos'] });
    await setStatus(headers, fernanda.body.application.id, 'in_contact');
    await setStatus(headers, denise.body.application.id, 'ended');
    const sentAt = [thiago, larissa, fernanda, denise].map((created, index) => ({ id: created.body.application.id as string, at: new Date(Date.UTC(2026, 9, 11 - index, 12)) }));
    for (const { id, at } of sentAt) await VolunteerApplication.update({ createdAt: at }, { where: { id }, silent: true });
    return { headers, ids: { thiago: thiago.body.application.id as string, larissa: larissa.body.application.id as string } };
  }

  it('lists the queue with the contact data of the profile, the counts per status and the right order', async () => {
    const { headers } = await queue();

    const { body } = await request(app).get('/api/admin/volunteer-applications').set(headers);

    expect(body.data.map((entry: { name: string }) => entry.name)).toEqual(['Thiago Ramos', 'Larissa Mendes', 'Fernanda Oliveira', 'Denise Costa']);
    expect(body.data[1]).toMatchObject({ status: 'new', email: 'pessoa2@exemplo.com', phone: '11981234567', message: 'Manhãs de sábado.' });
    expect(body.data[1].areas.map((area: { id: string }) => area.id)).toEqual(['apoio-pedagogico', 'comunicacao']);
    expect(body.data[3].phone).toBeNull();
    expect(body.counts).toEqual({ all: 4, new: 2, in_contact: 1, volunteering: 0, ended: 1 });
    expect(JSON.stringify(body)).not.toContain('passwordHash');
    expect(JSON.stringify(body)).not.toContain('isStaff');
  });

  it('filters by status and by area, counting inside the area but never inside the status', async () => {
    const { headers } = await queue();

    const byStatus = (await request(app).get('/api/admin/volunteer-applications?status=new').set(headers)).body;
    const byArea = (await request(app).get('/api/admin/volunteer-applications?area=producao-eventos').set(headers)).body;
    const both = (await request(app).get('/api/admin/volunteer-applications?area=producao-eventos&status=ended').set(headers)).body;
    const empty = (await request(app).get('/api/admin/volunteer-applications?area=administrativo&status=new').set(headers)).body;

    expect(byStatus.data.map((entry: { name: string }) => entry.name)).toEqual(['Thiago Ramos', 'Larissa Mendes']);
    expect(byStatus.counts.all).toBe(4);
    expect(byArea.data.map((entry: { name: string }) => entry.name)).toEqual(['Thiago Ramos', 'Denise Costa']);
    expect(byArea.counts).toEqual({ all: 2, new: 1, in_contact: 0, volunteering: 0, ended: 1 });
    expect(both.data.map((entry: { name: string }) => entry.name)).toEqual(['Denise Costa']);
    expect(empty.data).toEqual([]);
    expect(empty.counts.in_contact).toBe(1);
  });

  it('shows all the areas of an application even when filtering by only one of them', async () => {
    const { headers } = await queue();

    const { body } = await request(app).get('/api/admin/volunteer-applications?area=comunicacao').set(headers);

    expect(body.data).toHaveLength(1);
    expect(body.data[0].areas.map((area: { id: string }) => area.id)).toEqual(['apoio-pedagogico', 'comunicacao']);
  });

  it('answers the counts alone for the menu badge', async () => {
    const { headers } = await queue();

    const { body } = await request(app).get('/api/admin/volunteer-applications/counts').set(headers);

    expect(body).toEqual({ counts: { all: 4, new: 2, in_contact: 1, volunteering: 0, ended: 1 } });
  });

  it('changes the status, and only the status, and the person sees it on their own list', async () => {
    const { headers, ids } = await queue();
    const before = await VolunteerApplication.findByPk(ids.larissa);

    const response = await setStatus(headers, ids.larissa, 'volunteering');

    expect(response.status).toBe(200);
    expect(response.body.application.status).toBe('volunteering');
    const after = await VolunteerApplication.findByPk(ids.larissa);
    expect(after).toMatchObject({ status: 'volunteering', message: before!.message, userId: before!.userId });
    expect(after!.createdAt.toISOString()).toBe(before!.createdAt.toISOString());
  });

  it('accepts any transition between the four situations', async () => {
    const { headers, ids } = await queue();

    for (const status of ['volunteering', 'new', 'ended', 'in_contact', 'ended', 'volunteering']) {
      expect((await setStatus(headers, ids.larissa, status)).body.application.status).toBe(status);
    }
  });

  it('refuses to reopen an ended application when the person already has another one alive', async () => {
    const person = await signUp(1);
    const headers = await staff();
    const first = await apply(person.headers);
    await setStatus(headers, first.body.application.id, 'ended');
    await apply(person.headers, { areas: ['acervo'] });

    const reopened = await setStatus(headers, first.body.application.id, 'in_contact');

    expect(reopened.status).toBe(409);
    expect(reopened.body.error.code).toBe('live_application_exists');
    expect((await VolunteerApplication.findByPk(first.body.application.id))?.status).toBe('ended');
  });

  it('answers 404 for an application that does not exist', async () => {
    const headers = await staff();

    const response = await setStatus(headers, '99999999-9999-4999-8999-999999999999', 'ended');

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('application_not_found');
  });

  it('exports the queue with the same filters, neutralizing a formula typed into the name or the message', async () => {
    const headers = await staff();
    const hostile = await signUp(1, { name: '=HYPERLINK("http://malicioso.example")' });
    await apply(hostile.headers, { areas: ['acervo'], message: '@SOMA(A1:A9)' });
    const polite = await signUp(2, { name: 'Ana Souza' });
    await apply(polite.headers, { areas: ['comunicacao'] });

    const all = await request(app).get('/api/admin/volunteer-applications/export.csv').set(headers);
    const filtered = await request(app).get('/api/admin/volunteer-applications/export.csv?area=comunicacao').set(headers);

    expect(all.status).toBe(200);
    expect(all.text.startsWith('﻿Nome;Situação;')).toBe(true);
    expect(all.text).toContain(`"'=HYPERLINK(""http://malicioso.example"")"`);
    expect(all.text).toContain(`'@SOMA(A1:A9)`);
    expect(all.text).not.toMatch(/;=HYPERLINK|^=HYPERLINK|;@SOMA/m);
    expect(filtered.text).toContain('Ana Souza');
    expect(filtered.text).not.toContain('HYPERLINK');
  });
});
