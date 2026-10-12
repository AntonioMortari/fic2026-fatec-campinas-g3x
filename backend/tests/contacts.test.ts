import request from 'supertest';
import { createApp } from '../src/app';
import { Contact } from '../src/models';
import { MAX_CONTACTS_PER_ORIGIN_PER_HOUR } from '../src/services/contact.service';

const app = createApp();

const NOW = new Date('2026-10-11T15:00:00Z');
const URL = '/api/contacts';

const VALID = {
  name: 'Regina Lima',
  email: 'Regina.Lima@Exemplo.com',
  phone: '(11) 95396-8344',
  institution: 'EMEF Jardim São Bento',
  message: 'Gostaríamos de levar duas turmas do 3º ano para a contação de histórias em novembro.',
  consent: true,
};

function setup({ fromOrigin = 0 }: { fromOrigin?: number } = {}) {
  jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate', 'setTimeout'] });
  const count = jest.spyOn(Contact, 'count').mockResolvedValue(fromOrigin as never);
  const create = jest.spyOn(Contact, 'create').mockResolvedValue({} as never);
  return { count, create };
}

const post = (body: unknown = VALID, forwardedFor?: string) => {
  const req = request(app).post(URL);
  if (forwardedFor) req.set('X-Forwarded-For', forwardedFor);
  return req.send(body as object);
};

const fieldsOf = (response: request.Response) => (response.body.error.details as { field: string }[]).map((detail) => detail.field).sort();

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

describe('POST /api/contacts', () => {
  it('never takes the triage columns from the body: situation and internal note stay out of the row', async () => {
    const { create } = setup();

    await post({ ...VALID, status: 'done', staffNote: 'quem escreve não nota', staff_note: 'x' });

    const [values] = create.mock.calls[0]!;
    expect(Object.keys(values as object).sort()).toEqual(['consentedAt', 'email', 'institution', 'message', 'name', 'originHash', 'phone']);
  });

  it('registers the message, answers 201 and needs no token', async () => {
    const { create } = setup();

    const response = await post();

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('answers only that it arrived: no row, no name, no e-mail, no phone', async () => {
    setup();

    const response = await post();

    expect(response.body).toEqual({ received: true });
    expect(response.text).not.toMatch(/Regina|exemplo|95396|EMEF|duas turmas|originHash|origin_hash|id/i);
  });

  it('is never cached', async () => {
    setup();

    expect((await post()).headers['cache-control']).toBe('no-store');
  });

  it('cleans every field before saving', async () => {
    const { create } = setup();

    await post({ ...VALID, name: '  Regina Lima  ', email: '  Regina.Lima@Exemplo.com ', institution: '  EMEF  ', message: '  Linha um\nLinha dois  ' });

    expect(create).toHaveBeenCalledWith({
      name: 'Regina Lima',
      email: 'regina.lima@exemplo.com',
      phone: '11953968344',
      institution: 'EMEF',
      message: 'Linha um\nLinha dois',
      consentedAt: NOW,
      originHash: expect.stringMatching(/^[0-9a-f]{64}$/),
    });
  });

  it('keeps the phone and the institution optional: missing, null and blank all become null', async () => {
    const { create } = setup();

    const { phone: _phone, institution: _institution, ...withoutOptional } = VALID;
    const bodies = [withoutOptional, { ...withoutOptional, phone: null, institution: null }, { ...withoutOptional, phone: '   ', institution: '   ' }];
    for (const body of bodies) expect((await post(body)).status).toBe(201);

    for (const [row] of create.mock.calls) expect(row).toMatchObject({ phone: null, institution: null });
    expect(create).toHaveBeenCalledTimes(3);
  });

  it('records the consent as the date of the submission, never as a boolean', async () => {
    const { create } = setup();

    await post();

    const row = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(row.consentedAt).toEqual(NOW);
    expect(Object.keys(row)).not.toContain('consent');
    expect(Object.values(row)).not.toContain(true);
  });

  it('ignores whatever else the body names, and writes exactly the columns listed by hand', async () => {
    const { create } = setup();

    await post({ ...VALID, id: 'x', createdAt: '2000-01-01', consentedAt: '2000-01-01', originHash: 'a'.repeat(64), isStaff: true, status: 'answered', userId: 'y' });

    const row = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(Object.keys(row).sort()).toEqual(['consentedAt', 'email', 'institution', 'message', 'name', 'originHash', 'phone']);
    expect(row.consentedAt).toEqual(NOW);
    expect(row.originHash).not.toBe('a'.repeat(64));
  });
});

describe('the consent', () => {
  it.each([
    ['false', false],
    ['the string "true"', 'true'],
    ['1', 1],
    ['null', null],
  ])('refuses %s, on its own field, and writes nothing', async (_label, consent) => {
    const { create } = setup();

    const response = await post({ ...VALID, consent });

    expect(response.status).toBe(400);
    expect(fieldsOf(response)).toEqual(['consent']);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses when the field is missing', async () => {
    const { create } = setup();

    const { consent: _consent, ...withoutConsent } = VALID;
    const response = await post(withoutConsent);

    expect(response.status).toBe(400);
    expect(fieldsOf(response)).toEqual(['consent']);
    expect(create).not.toHaveBeenCalled();
  });

  it('says in Portuguese what the person agrees to', async () => {
    setup();

    const response = await post({ ...VALID, consent: false });

    expect(response.body.error.details[0].message).toBe('Para enviar, precisamos que você concorde com o uso dos seus dados para responder esta mensagem.');
  });
});

describe('validation, field by field, in Portuguese', () => {
  it.each([
    ['an empty name', { name: '' }, 'name', 'Escreva seu nome.'],
    ['a blank name', { name: '   ' }, 'name', 'Escreva seu nome.'],
    ['a name over 120 characters', { name: 'a'.repeat(121) }, 'name', 'O nome passou de 120 caracteres.'],
    ['an e-mail without the @', { email: 'regina.lima.exemplo.com' }, 'email', 'Falta o @. Exemplo: nome@exemplo.com.'],
    ['an e-mail with no domain', { email: 'regina@' }, 'email', 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.'],
    ['an empty e-mail', { email: '' }, 'email', 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.'],
    ['an e-mail over 254 characters', { email: `${'a'.repeat(250)}@exemplo.com` }, 'email', 'O e-mail passou de 254 caracteres.'],
    ['a phone without the area code', { phone: '5396-8344' }, 'phone', 'O telefone precisa incluir o DDD, como (11) 95396-8344.'],
    ['a phone with only a few digits', { phone: '(11) 5396' }, 'phone', 'O telefone precisa incluir o DDD, como (11) 95396-8344.'],
    ['a phone with nine digits', { phone: '953968344' }, 'phone', 'Falta um dígito. Exemplo: (11) 98765-4321.'],
    ['a phone with too many digits', { phone: '5511953968344' }, 'phone', 'O telefone precisa incluir o DDD, como (11) 95396-8344.'],
    ['an institution over 160 characters', { institution: 'a'.repeat(161) }, 'institution', 'O nome da instituição passou de 160 caracteres.'],
    ['an empty message', { message: '' }, 'message', 'Escreva sua mensagem.'],
    ['a blank message', { message: ' \n  ' }, 'message', 'Escreva sua mensagem.'],
    ['a message over 5,000 characters', { message: 'a'.repeat(5001) }, 'message', expect.stringContaining('A mensagem passou de 5.000 caracteres.')],
  ])('refuses %s', async (_label, change, field, message) => {
    const { create } = setup();

    const response = await post({ ...VALID, ...change });

    expect(response.status).toBe(400);
    expect(fieldsOf(response)).toEqual([field]);
    expect(response.body.error.details[0].message).toEqual(message);
    expect(create).not.toHaveBeenCalled();
  });

  it('accepts every field exactly at its limit', async () => {
    const { create } = setup();

    const response = await post({
      ...VALID,
      name: 'a'.repeat(120),
      email: `${'a'.repeat(242)}@exemplo.com`.slice(0, 254),
      institution: 'a'.repeat(160),
      message: 'a'.repeat(5000),
    });

    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('requires the name, the e-mail, the message and the consent, and reports every problem at once', async () => {
    const { create } = setup();

    const response = await post({});

    expect(response.status).toBe(400);
    expect(fieldsOf(response)).toEqual(['consent', 'email', 'message', 'name']);
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses text fields sent as something else', async () => {
    const { create } = setup();

    for (const field of ['name', 'email', 'message', 'phone', 'institution']) {
      for (const hostile of [['a'], { $ne: '' }, 12, true]) {
        const response = await post({ ...VALID, [field]: hostile });
        expect(response.status).toBe(400);
        expect(fieldsOf(response)).toEqual([field]);
      }
    }
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses a body that is not an object', async () => {
    const { create } = setup();

    for (const body of [[], 'texto', 5]) {
      const response = await request(app).post(URL).set('Content-Type', 'application/json').send(JSON.stringify(body));
      expect(response.status).toBe(400);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it('keeps accents and emoji in the message', async () => {
    const { create } = setup();

    await post({ ...VALID, message: 'Contação com cafuné ☕ e coração' });

    expect(create).toHaveBeenCalledWith(expect.objectContaining({ message: 'Contação com cafuné ☕ e coração' }));
  });
});

describe('there is no way to read the messages back', () => {
  it.each(['get', 'put', 'patch', 'delete'] as const)('has no %s on /api/contacts', async (method) => {
    setup();

    const response = await request(app)[method](URL).send({});

    expect(response.status).toBe(404);
  });

  it('has nothing under /api/contacts/:id', async () => {
    setup();

    expect((await request(app).get(`${URL}/22222222-2222-4222-8222-222222222222`)).status).toBe(404);
  });
});

describe('the limit per connection', () => {
  it('stores a keyed hash of the connection, never the address', async () => {
    const { create } = setup();

    await post(VALID, '203.0.113.7');

    const row = create.mock.calls[0]![0] as unknown as { originHash: string };
    expect(row.originHash).toMatch(/^[0-9a-f]{64}$/);
    expect(JSON.stringify(create.mock.calls)).not.toContain('203.0.113.7');
  });

  it('is the same for the same connection and different for another', async () => {
    const { create } = setup();

    await post(VALID, '203.0.113.7');
    await post(VALID, '203.0.113.7');
    await post(VALID, '203.0.113.8');

    const hashes = create.mock.calls.map(([row]) => (row as unknown as { originHash: string }).originHash);
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[2]).not.toBe(hashes[0]);
  });

  it('counts by that same hash, so the limit follows the connection', async () => {
    const { create, count } = setup();

    await post(VALID, '203.0.113.7');

    const row = create.mock.calls[0]![0] as unknown as { originHash: string };
    expect((count.mock.calls[0]![0] as { where: { originHash: string } }).where.originHash).toBe(row.originHash);
  });

  it('gives two addresses of the same IPv6 /64 the same origin, and a neighbour another', async () => {
    const { create } = setup();

    await post(VALID, '2001:db8:1:1::a');
    await post(VALID, '2001:db8:1:1:ffff::b');
    await post(VALID, '2001:db8:1:2::a');

    const hashes = create.mock.calls.map(([row]) => (row as unknown as { originHash: string }).originHash);
    expect(hashes[0]).toBe(hashes[1]);
    expect(hashes[2]).not.toBe(hashes[0]);
  });

  it('allows 30 messages an hour per connection', () => {
    expect(MAX_CONTACTS_PER_ORIGIN_PER_HOUR).toBe(30);
  });

  it("refuses with 429 when the connection already sent the hour's share, and writes nothing", async () => {
    const { create } = setup({ fromOrigin: 30 });

    const response = await post();

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('too_many_requests');
    expect(response.body.error.message).toContain('WhatsApp');
    expect(create).not.toHaveBeenCalled();
  });

  it('lets a whole class through one connection: 29 already is not the limit', async () => {
    const { create } = setup({ fromOrigin: 29 });

    expect((await post()).status).toBe(201);
    expect(create).toHaveBeenCalledTimes(1);
  });

  it('counts only the last hour', async () => {
    const { count } = setup({ fromOrigin: 3 });

    await post();

    const where = (count.mock.calls[0]![0] as { where: { createdAt: Record<symbol, Date> } }).where;
    const [since] = Object.getOwnPropertySymbols(where.createdAt).map((symbol) => where.createdAt[symbol]!);
    expect(NOW.getTime() - since!.getTime()).toBe(60 * 60 * 1000);
  });

  it('does not spend the limit on a message that was refused', async () => {
    const { count, create } = setup();

    await post({ ...VALID, consent: false });

    expect(count).not.toHaveBeenCalled();
    expect(create).not.toHaveBeenCalled();
  });
});
