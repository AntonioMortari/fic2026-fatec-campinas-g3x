import request from 'supertest';
import { createApp } from '../src/app';
import { Contact, User } from '../src/models';
import { contactsCsv } from '../src/services/admin-contacts.service';
import { signToken } from '../src/utils/token';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const CONTACT_ID = '44444444-4444-4444-8444-444444444444';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const BASE = '/api/admin/contacts';

function contact(overrides: Record<string, unknown> = {}) {
  return {
    id: CONTACT_ID,
    status: 'new',
    name: 'Regina Lima',
    email: 'regina@exemplo.com',
    phone: '11953968344',
    institution: 'EMEF Jardim São Bento',
    message: 'Gostaríamos de levar duas turmas do 3º ano.',
    staffNote: null,
    consentedAt: new Date('2026-10-08T13:42:00Z'),
    originHash: 'a'.repeat(64),
    createdAt: new Date('2026-10-08T13:42:00Z'),
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as Contact;
}

function setup(rows: Contact[] = [contact()], { staff = true }: { staff?: boolean } = {}) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: staff } as unknown as User);
  const findAll = jest.spyOn(Contact, 'findAll').mockImplementation((async (options?: { raw?: boolean }) =>
    options?.raw
      ? [
          { status: 'new', total: '4' },
          { status: 'done', total: 1 },
        ]
      : rows) as never);
  const findByPk = jest.spyOn(Contact, 'findByPk').mockResolvedValue(rows[0] ?? null);
  return { findAll, findByPk };
}

const listCall = (findAll: jest.SpyInstance) => findAll.mock.calls.find(([options]) => !(options as { raw?: boolean } | undefined)?.raw)![0] as Record<string, unknown>;

afterEach(() => jest.restoreAllMocks());

describe('the staff guard on every contact route', () => {
  const routes: [string, string][] = [
    ['get', BASE],
    ['get', `${BASE}/counts`],
    ['get', `${BASE}/export.csv`],
    ['get', `${BASE}/${CONTACT_ID}`],
    ['patch', `${BASE}/${CONTACT_ID}`],
  ];

  it.each(routes)('%s %s answers 401 without a session and reads nothing', async (method, url) => {
    const { findAll, findByPk } = setup();

    const response = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url).send({ status: 'done' });

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
    expect(findByPk).not.toHaveBeenCalled();
  });

  it.each(routes)('%s %s answers 403 to someone who is not staff and touches nothing', async (method, url) => {
    const { findAll, findByPk } = setup([contact()], { staff: false });

    const response = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url).set(auth).send({ status: 'done' });

    expect(response.status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/contacts', () => {
  it('lists the message with its contact data, the counts per situation and the pagination', async () => {
    setup();

    const response = await request(app).get(BASE).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data).toEqual([
      {
        id: CONTACT_ID,
        status: 'new',
        name: 'Regina Lima',
        email: 'regina@exemplo.com',
        phone: '11953968344',
        institution: 'EMEF Jardim São Bento',
        message: 'Gostaríamos de levar duas turmas do 3º ano.',
        staffNote: null,
        createdAt: '2026-10-08T13:42:00.000Z',
      },
    ]);
    expect(response.body.counts).toEqual({ all: 5, new: 4, in_contact: 0, done: 1 });
    expect(response.body.pagination).toEqual({ page: 1, pageSize: 20, total: 5, totalPages: 1 });
  });

  it('never sends the origin hash or the consent date', async () => {
    const { findAll } = setup();

    const { body } = await request(app).get(BASE).set(auth);

    expect(Object.keys(body.data[0]).sort()).toEqual(['createdAt', 'email', 'id', 'institution', 'message', 'name', 'phone', 'staffNote', 'status']);
    expect(JSON.stringify(body)).not.toContain('a'.repeat(64));
    expect(listCall(findAll).attributes).not.toContain('originHash');
  });

  it('asks the database for the queue order, the page and the status filter', async () => {
    const { findAll } = setup();

    await request(app).get(`${BASE}?status=in_contact&page=3&pageSize=10`).set(auth);

    const options = listCall(findAll) as { where: unknown; limit: number; offset: number; order: unknown[] };
    expect(options.where).toEqual({ status: 'in_contact' });
    expect(options.limit).toBe(10);
    expect(options.offset).toBe(20);
    expect(options.order).toHaveLength(3);
    expect(options.order[1]).toEqual(['createdAt', 'DESC']);
  });

  it('uses the count of the filter as the total, so the last page is right', async () => {
    setup();

    const { body } = await request(app).get(`${BASE}?status=new&pageSize=3`).set(auth);

    expect(body.pagination).toEqual({ page: 1, pageSize: 3, total: 4, totalPages: 2 });
  });

  it.each([['status=zzz'], ['status='], ['page=0'], ['page=abc'], ['page=1.5'], ['pageSize=0'], ['pageSize=101']])('refuses %s with 400', async (query) => {
    const { findAll } = setup();

    const response = await request(app).get(`${BASE}?${query}`).set(auth);

    expect(response.status).toBe(400);
    expect(findAll).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/contacts/counts', () => {
  it('answers the counts and nothing else, with zero for the situations that have no row', async () => {
    setup();

    const response = await request(app).get(`${BASE}/counts`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ counts: { all: 5, new: 4, in_contact: 0, done: 1 } });
  });
});

describe('GET /api/admin/contacts/:id', () => {
  it('answers one message', async () => {
    setup();

    const response = await request(app).get(`${BASE}/${CONTACT_ID}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.contact).toMatchObject({ id: CONTACT_ID, name: 'Regina Lima' });
    expect(response.body.contact.originHash).toBeUndefined();
  });

  it('answers 404 with its own code for a message that does not exist', async () => {
    setup([]);

    const response = await request(app).get(`${BASE}/${CONTACT_ID}`).set(auth);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('contact_not_found');
  });

  it('answers 400 for an identifier that is not a UUID, without asking the database', async () => {
    const { findByPk } = setup();

    const response = await request(app).get(`${BASE}/nao-e-uuid`).set(auth);

    expect(response.status).toBe(400);
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/admin/contacts/:id', () => {
  it.each(['new', 'in_contact', 'done'])('moves to %s, whatever it was before: every transition exists', async (status) => {
    const row = contact({ status: 'done' });
    setup([row]);

    const response = await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({ status });

    expect(response.status).toBe(200);
    expect(row.update).toHaveBeenCalledWith({ status }, { fields: ['status', 'staffNote'] });
  });

  it('writes status and staff note and nothing else, even when the body names other columns', async () => {
    const row = contact();
    setup([row]);

    await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({
      status: 'in_contact',
      staffNote: '  liguei, volta dia 15  ',
      name: 'Outra pessoa',
      email: 'outro@exemplo.com',
      phone: '11900000000',
      message: 'mensagem trocada',
      originHash: 'b'.repeat(64),
      id: 'outro-id',
    });

    const [values, options] = (row.update as jest.Mock).mock.calls[0]!;
    expect(values).toEqual({ status: 'in_contact', staffNote: 'liguei, volta dia 15' });
    expect(options.fields).toEqual(['status', 'staffNote']);
  });

  it('changes only the note when only the note comes, and an empty note clears it', async () => {
    const row = contact({ staffNote: 'antiga' });
    setup([row]);

    await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({ staffNote: '   ' });

    expect((row.update as jest.Mock).mock.calls[0]![0]).toEqual({ staffNote: null });
  });

  it('accepts null as clearing the note', async () => {
    const row = contact({ staffNote: 'antiga' });
    setup([row]);

    const response = await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({ staffNote: null });

    expect(response.status).toBe(200);
    expect((row.update as jest.Mock).mock.calls[0]![0]).toEqual({ staffNote: null });
  });

  it.each([[{}], [{ name: 'x' }], [{ status: 'aprovada' }], [{ status: '' }], [{ status: 3 }], [{ staffNote: 5 }], [{ staffNote: 'a'.repeat(2001) }]])(
    'refuses the body %j with 400 and writes nothing',
    async (body) => {
      const row = contact();
      setup([row]);

      const response = await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send(body);

      expect(response.status).toBe(400);
      expect(row.update).not.toHaveBeenCalled();
    },
  );

  it('accepts a note of exactly 2000 characters', async () => {
    setup();

    const response = await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({ staffNote: 'a'.repeat(2000) });

    expect(response.status).toBe(200);
  });

  it('answers 404 when the message does not exist', async () => {
    setup([]);

    const response = await request(app).patch(`${BASE}/${CONTACT_ID}`).set(auth).send({ status: 'done' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('contact_not_found');
  });
});

describe('what the staff router does not offer', () => {
  it.each([
    ['delete', `${BASE}/${CONTACT_ID}`],
    ['post', BASE],
    ['put', `${BASE}/${CONTACT_ID}`],
  ])('%s %s is not a route, even for staff', async (method, url) => {
    const { findByPk } = setup();

    const response = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url).set(auth).send({ status: 'done' });

    expect([404, 405]).toContain(response.status);
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/contacts/export.csv', () => {
  it('downloads the queue as a spreadsheet: semicolon, BOM, CRLF, staff labels and the internal note', async () => {
    setup([contact({ staffNote: 'liguei' })]);

    const response = await request(app).get(`${BASE}/export.csv`).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toBe('attachment; filename="mensagens.csv"');
    expect(response.text.startsWith('﻿Nome;Situação;Instituição;E-mail;Telefone;Mensagem;Nota interna;Recebida em\r\n')).toBe(true);
    expect(response.text).toContain(
      'Regina Lima;Nova;EMEF Jardim São Bento;regina@exemplo.com;(11) 95396-8344;Gostaríamos de levar duas turmas do 3º ano.;liguei;08/10/2026 10:42\r\n',
    );
  });

  it('applies the status filter and does not paginate', async () => {
    const { findAll } = setup();

    await request(app).get(`${BASE}/export.csv?status=done`).set(auth);

    const options = listCall(findAll) as { where: unknown; limit?: number };
    expect(options.where).toEqual({ status: 'done' });
    expect(options.limit).toBeUndefined();
  });

  it('neutralizes anything a spreadsheet would run as a formula, in every cell a person wrote', () => {
    const csv = contactsCsv([
      {
        id: 'a',
        status: 'new',
        name: '+cmd|calc',
        email: '@alguem@exemplo.com',
        phone: null,
        institution: '-escola',
        message: '=HYPERLINK("http://malicioso.example","clique")',
        staffNote: '=1+1',
        createdAt: '2026-10-09T17:20:00.000Z',
      },
    ]);

    const [, line] = csv.split('\r\n');
    const cells = line!.split(';');
    expect(cells[0]).toBe("'+cmd|calc");
    expect(cells[2]).toBe("'-escola");
    expect(cells[3]).toBe("'@alguem@exemplo.com");
    expect(line).toContain(`"'=HYPERLINK(""http://malicioso.example"",""clique"")"`);
    expect(cells[6]).toBe("'=1+1");
  });

  it('keeps a line break and a quote inside the cell, not in the row', () => {
    const csv = contactsCsv([
      {
        id: 'a',
        status: 'done',
        name: 'Denise Costa',
        email: 'denise@exemplo.com',
        phone: null,
        institution: null,
        message: 'primeira linha\nsegunda "linha"',
        staffNote: null,
        createdAt: '2026-10-09T17:20:00.000Z',
      },
    ]);

    expect(csv).toContain('Denise Costa;Concluída;;denise@exemplo.com;;"primeira linha\nsegunda ""linha""";;');
  });
});
