import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Contact, RefreshToken, sequelize, User } from '../../src/models';

const app = createApp();
const BASE = '/api/admin/contacts';

const account = (n: number) => ({
  name: `Pessoa ${n}`,
  email: `pessoa${n}@exemplo.com`,
  phone: '11981234567',
  personType: 'individual',
  password: 'uma-senha-boa',
  wantsToVolunteer: true,
  wantsToDonate: false,
  confirmsAdult: true,
  consent: true,
});

async function signUp(n: number) {
  const response = await request(app).post('/api/auth/register').send(account(n));
  return { id: response.body.user.id as string, headers: { Authorization: `Bearer ${response.body.token}` } };
}

async function staff() {
  const person = await signUp(900);
  await User.update({ isStaff: true }, { where: { id: person.id } });
  return person.headers;
}

let seq = 0;
async function put(name: string, status: 'new' | 'in_contact' | 'done', createdAt: string, overrides: Record<string, unknown> = {}) {
  seq += 1;
  return Contact.create({
    name,
    email: `contato${seq}@exemplo.com`,
    phone: null,
    institution: null,
    message: `Mensagem de ${name}`,
    consentedAt: new Date(createdAt),
    originHash: null,
    status,
    staffNote: null,
    createdAt: new Date(createdAt),
    ...overrides,
  });
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Contact.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('the staff queue of contact messages against a real MySQL', () => {
  it('refuses a plain account and an anonymous caller on every route', async () => {
    const row = await put('Ana', 'new', '2026-10-01T10:00:00Z');
    const plain = await signUp(1);
    const urls = [BASE, `${BASE}/counts`, `${BASE}/export.csv`, `${BASE}/${row.id}`];

    for (const url of urls) {
      expect((await request(app).get(url)).status).toBe(401);
      expect((await request(app).get(url).set(plain.headers)).status).toBe(403);
    }
    const patch = await request(app).patch(`${BASE}/${row.id}`).set(plain.headers).send({ status: 'done' });
    expect(patch.status).toBe(403);
    expect((await row.reload()).status).toBe('new');
  });

  it('orders the queue new, in contact, done and the newest first inside each', async () => {
    await put('concluida-recente', 'done', '2026-10-12T10:00:00Z');
    await put('em-contato', 'in_contact', '2026-10-08T10:00:00Z');
    await put('nova-antiga', 'new', '2026-10-01T10:00:00Z');
    await put('nova-hoje', 'new', '2026-10-11T10:00:00Z');
    const headers = await staff();

    const { body } = await request(app).get(BASE).set(headers);

    expect(body.data.map((entry: { name: string }) => entry.name)).toEqual(['nova-hoje', 'nova-antiga', 'em-contato', 'concluida-recente']);
    expect(body.counts).toEqual({ all: 4, new: 2, in_contact: 1, done: 1 });
  });

  it('paginates over the ordered list: no message is lost or repeated between pages', async () => {
    for (let n = 1; n <= 5; n += 1) await put(`nova-${n}`, 'new', `2026-10-0${n}T10:00:00Z`);
    for (let n = 1; n <= 4; n += 1) await put(`concluida-${n}`, 'done', `2026-10-1${n}T10:00:00Z`);
    await put('contato-1', 'in_contact', '2026-10-06T10:00:00Z');
    const headers = await staff();

    const pages = [];
    for (const page of [1, 2, 3, 4]) pages.push((await request(app).get(`${BASE}?page=${page}&pageSize=3`).set(headers)).body);

    expect(pages[0].pagination).toEqual({ page: 1, pageSize: 3, total: 10, totalPages: 4 });
    const names = pages.flatMap((entry) => entry.data.map((row: { name: string }) => row.name));
    expect(names).toEqual(['nova-5', 'nova-4', 'nova-3', 'nova-2', 'nova-1', 'contato-1', 'concluida-4', 'concluida-3', 'concluida-2', 'concluida-1']);
    expect(pages.map((entry) => entry.data.length)).toEqual([3, 3, 3, 1]);
  });

  it('filters by situation and totals the filter, while the counts still cover the whole queue', async () => {
    await put('a', 'new', '2026-10-01T10:00:00Z');
    await put('b', 'done', '2026-10-02T10:00:00Z');
    await put('c', 'done', '2026-10-03T10:00:00Z');
    const headers = await staff();

    const { body } = await request(app).get(`${BASE}?status=done&pageSize=1`).set(headers);

    expect(body.data.map((entry: { name: string }) => entry.name)).toEqual(['c']);
    expect(body.pagination).toEqual({ page: 1, pageSize: 1, total: 2, totalPages: 2 });
    expect(body.counts).toEqual({ all: 3, new: 1, in_contact: 0, done: 2 });
  });

  it('answers an empty page past the end instead of an error', async () => {
    await put('a', 'new', '2026-10-01T10:00:00Z');
    const headers = await staff();

    const { status, body } = await request(app).get(`${BASE}?page=9`).set(headers);

    expect(status).toBe(200);
    expect(body.data).toEqual([]);
    expect(body.pagination.total).toBe(1);
  });

  it('never exposes the origin hash or the consent date', async () => {
    const row = await put('a', 'new', '2026-10-01T10:00:00Z', { originHash: 'c'.repeat(64) });
    const headers = await staff();

    const list = await request(app).get(BASE).set(headers);
    const one = await request(app).get(`${BASE}/${row.id}`).set(headers);

    expect(JSON.stringify([list.body, one.body])).not.toContain('c'.repeat(64));
    expect(JSON.stringify([list.body, one.body])).not.toContain('consent');
  });

  it('answers 404 for an unknown id, on read and on change', async () => {
    const headers = await staff();
    const unknown = '99999999-9999-4999-8999-999999999999';

    expect((await request(app).get(`${BASE}/${unknown}`).set(headers)).status).toBe(404);
    expect((await request(app).patch(`${BASE}/${unknown}`).set(headers).send({ status: 'done' })).status).toBe(404);
  });
});

describe('changing a message against a real MySQL', () => {
  it('moves the situation in every direction and keeps the note', async () => {
    const row = await put('a', 'done', '2026-10-01T10:00:00Z', { staffNote: 'ligar' });
    const headers = await staff();

    for (const status of ['new', 'in_contact', 'done', 'new']) {
      const response = await request(app).patch(`${BASE}/${row.id}`).set(headers).send({ status });
      expect(response.status).toBe(200);
      expect(response.body.contact.status).toBe(status);
    }
    expect((await row.reload()).staffNote).toBe('ligar');
  });

  it('writes the note trimmed, with accent and emoji, and clears it with an empty text', async () => {
    const row = await put('a', 'new', '2026-10-01T10:00:00Z');
    const headers = await staff();

    await request(app).patch(`${BASE}/${row.id}`).set(headers).send({ staffNote: '  Liguei ☕ — volta dia 15  ' });
    expect((await row.reload()).staffNote).toBe('Liguei ☕ — volta dia 15');
    expect((await row.reload()).status).toBe('new');

    await request(app).patch(`${BASE}/${row.id}`).set(headers).send({ staffNote: '' });
    expect((await row.reload()).staffNote).toBeNull();
  });

  it('ignores every other column of the body and leaves what the person wrote untouched', async () => {
    const row = await put('Regina', 'new', '2026-10-01T10:00:00Z', { phone: '11953968344', institution: 'EMEF X' });
    const before = await Contact.findByPk(row.id, { raw: true });
    const headers = await staff();

    const response = await request(app).patch(`${BASE}/${row.id}`).set(headers).send({
      status: 'in_contact',
      name: 'Outra',
      email: 'outro@exemplo.com',
      phone: '11900000000',
      institution: 'Outra',
      message: 'trocada',
      originHash: 'd'.repeat(64),
      consentedAt: '2000-01-01T00:00:00Z',
      createdAt: '2000-01-01T00:00:00Z',
      id: '99999999-9999-4999-8999-999999999999',
    });

    expect(response.status).toBe(200);
    const after = await Contact.findByPk(row.id, { raw: true });
    expect(after).toEqual({ ...before, status: 'in_contact' });
  });

  it('refuses an empty body, a status outside the list and a note over 2000 characters, writing nothing', async () => {
    const row = await put('a', 'new', '2026-10-01T10:00:00Z');
    const headers = await staff();

    for (const body of [{}, { status: 'aprovada' }, { staffNote: 'a'.repeat(2001) }]) {
      expect((await request(app).patch(`${BASE}/${row.id}`).set(headers).send(body)).status).toBe(400);
    }
    expect(await Contact.findByPk(row.id, { raw: true })).toMatchObject({ status: 'new', staffNote: null });
  });

  it('has no DELETE: the message is still there afterwards', async () => {
    const row = await put('a', 'done', '2026-10-01T10:00:00Z');
    const headers = await staff();

    const response = await request(app).delete(`${BASE}/${row.id}`).set(headers);

    expect([404, 405]).toContain(response.status);
    expect(await Contact.count()).toBe(1);
  });
});

describe('the spreadsheet against a real MySQL', () => {
  it('downloads every message of the filter in queue order, with BOM, accents and a neutralized formula', async () => {
    await put('=cmd', 'new', '2026-10-01T10:00:00Z', { message: 'Contação ☕ com cafuné', staffNote: 'liguei' });
    await put('Beatriz', 'done', '2026-10-02T10:00:00Z');
    const headers = await staff();

    const all = await request(app).get(`${BASE}/export.csv`).set(headers);
    const done = await request(app).get(`${BASE}/export.csv?status=done`).set(headers);

    expect(all.text.startsWith('﻿Nome;Situação;')).toBe(true);
    const lines = all.text.split('\r\n').filter(Boolean);
    expect(lines).toHaveLength(3);
    expect(lines[1]).toContain("'=cmd;Nova;");
    expect(lines[1]).toContain('Contação ☕ com cafuné;liguei;');
    expect(lines[2]).toContain('Beatriz;Concluída;');
    expect(done.text.split('\r\n').filter(Boolean)).toHaveLength(2);
  });

  it('exports past the page size: the spreadsheet is not the first page', async () => {
    for (let n = 1; n <= 25; n += 1) await put(`p${n}`, 'new', `2026-10-01T10:${String(n).padStart(2, '0')}:00Z`);
    const headers = await staff();

    const response = await request(app).get(`${BASE}/export.csv`).set(headers);

    expect(response.text.split('\r\n').filter(Boolean)).toHaveLength(26);
  });
});

describe('the migration', () => {
  it('adds the two columns with the right defaults', async () => {
    const columns = await sequelize.getQueryInterface().describeTable('contacts');
    expect(columns.status).toMatchObject({ allowNull: false, defaultValue: 'new' });
    expect(columns.staff_note).toMatchObject({ allowNull: true });
  });
});
