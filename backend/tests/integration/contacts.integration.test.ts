import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Contact, sequelize } from '../../src/models';

const app = createApp();

const HOUR_MS = 60 * 60 * 1000;

const message = (n: number, overrides: Record<string, unknown> = {}) => ({
  name: `Pessoa ${n}`,
  email: `pessoa${n}@exemplo.com`,
  message: `Mensagem número ${n}`,
  consent: true,
  ...overrides,
});

const send = (body: object, ip?: string) => {
  const req = request(app).post('/api/contacts');
  if (ip) req.set('X-Forwarded-For', ip);
  return req.send(body);
};

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Contact.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('contact messages against a real MySQL', () => {
  it('stores the message without a session and answers only that it arrived', async () => {
    const response = await send({
      name: 'Regina Lima',
      email: 'Regina.Lima@Exemplo.com',
      phone: '(11) 95396-8344',
      institution: 'EMEF Jardim São Bento',
      message: 'Gostaríamos de levar duas turmas do 3º ano.',
      consent: true,
    });

    expect(response.status).toBe(201);
    expect(response.body).toEqual({ received: true });
    const rows = await Contact.findAll();
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      name: 'Regina Lima',
      email: 'regina.lima@exemplo.com',
      phone: '11953968344',
      institution: 'EMEF Jardim São Bento',
      message: 'Gostaríamos de levar duas turmas do 3º ano.',
    });
    expect(rows[0]!.id).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('records the consent as a date close to the moment of sending, and has no boolean column for it', async () => {
    const before = Date.now();

    await send(message(1));

    const row = await Contact.findOne();
    expect(row!.consentedAt).toBeInstanceOf(Date);
    expect(row!.consentedAt.getTime()).toBeGreaterThanOrEqual(before - 1000);
    expect(row!.consentedAt.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
    const columns = Object.keys(await sequelize.getQueryInterface().describeTable('contacts'));
    expect(columns.sort()).toEqual(['consented_at', 'created_at', 'email', 'id', 'institution', 'message', 'name', 'origin_hash', 'phone']);
  });

  it('refuses without the consent and writes nothing', async () => {
    const response = await send(message(1, { consent: false }));

    expect(response.status).toBe(400);
    expect(await Contact.count()).toBe(0);
  });

  it('stores the optional fields as NULL, not as empty text', async () => {
    await send(message(1, { phone: '', institution: '   ' }));

    expect(await Contact.findOne()).toMatchObject({ phone: null, institution: null });
  });

  it('keeps accents, emoji and a message of 5,000 characters intact', async () => {
    const long = 'ã'.repeat(5000);

    await send(message(1, { message: long }));
    await send(message(2, { message: 'Contação ☕ com cafuné ✊🏿' }));

    const rows = await Contact.findAll({ order: [['name', 'ASC']] });
    expect(rows[0]!.message).toBe(long);
    expect(rows[1]!.message).toBe('Contação ☕ com cafuné ✊🏿');
  });

  it('ignores the columns the body tries to name', async () => {
    await send(message(1, { id: '33333333-3333-4333-8333-333333333333', createdAt: '2000-01-01T00:00:00Z', consentedAt: '2000-01-01T00:00:00Z', originHash: 'f'.repeat(64) }));

    const row = await Contact.findOne();
    expect(row!.id).not.toBe('33333333-3333-4333-8333-333333333333');
    expect(row!.createdAt.getFullYear()).toBeGreaterThan(2000);
    expect(row!.consentedAt.getFullYear()).toBeGreaterThan(2000);
    expect(row!.originHash).not.toBe('f'.repeat(64));
  });

  it('never writes the address of the visitor anywhere, only a 64-hex hash', async () => {
    await send(message(1), '203.0.113.7');

    const row = await Contact.findOne({ raw: true });
    expect(row!.originHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(row)).not.toContain('203.0.113.7');
    expect(JSON.stringify(row)).not.toContain('203');
  });

  it('stops a connection at 30 messages in the hour, and lets another one through', async () => {
    const statuses: number[] = [];
    for (let n = 1; n <= 30; n += 1) statuses.push((await send(message(n), '203.0.113.99')).status);

    const blocked = await send(message(31), '203.0.113.99');
    const neighbour = await send(message(32), '203.0.113.98');

    expect(statuses.every((status) => status === 201)).toBe(true);
    expect(blocked.status).toBe(429);
    expect(blocked.body.error.code).toBe('too_many_requests');
    expect(neighbour.status).toBe(201);
    expect(await Contact.count()).toBe(31);
  });

  it('treats the whole IPv6 /64 as one connection', async () => {
    for (let n = 1; n <= 30; n += 1) {
      expect((await send(message(n), `2001:db8:aa:bb:${n.toString(16)}::1`)).status).toBe(201);
    }

    expect((await send(message(31), '2001:db8:aa:bb:ffff::2')).status).toBe(429);
    expect((await send(message(32), '2001:db8:aa:cc::2')).status).toBe(201);
  });

  it('counts only the last hour: a message older than that does not weigh', async () => {
    for (let n = 1; n <= 30; n += 1) await send(message(n), '203.0.113.50');

    await Contact.update({ createdAt: new Date(Date.now() - 59 * 60 * 1000) }, { where: {}, silent: true });
    expect((await send(message(31), '203.0.113.50')).status).toBe(429);

    await Contact.update({ createdAt: new Date(Date.now() - HOUR_MS - 60 * 1000) }, { where: {}, silent: true });
    expect((await send(message(32), '203.0.113.50')).status).toBe(201);
  });

  it('does not spend the limit on refused messages', async () => {
    for (let n = 1; n <= 40; n += 1) await send(message(n, { consent: false }), '203.0.113.60');

    expect((await send(message(41), '203.0.113.60')).status).toBe(201);
  });

  it('has no route that reads the messages back', async () => {
    await send(message(1));

    expect((await request(app).get('/api/contacts')).status).toBe(404);
    expect((await request(app).get('/api/admin/contacts')).status).toBe(404);
  });

  it('is refused by the database itself when the NOT NULL columns are missing', async () => {
    await expect(Contact.create({ name: 'x', email: 'x@x.com', phone: null, institution: null, message: 'm', originHash: null } as never)).rejects.toThrow();
  });
});
