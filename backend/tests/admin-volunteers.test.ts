import { Op, UniqueConstraintError } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { User, VolunteerApplication, VolunteerApplicationArea, VolunteerArea, sequelize } from '../src/models';
import { applicationsCsv } from '../src/services/admin-volunteers.service';
import { signToken } from '../src/utils/token';

const app = createApp();
const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const APPLICATION_ID = '33333333-3333-4333-8333-333333333333';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const BASE = '/api/admin/volunteer-applications';

const PEDAGOGICAL = { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas', sortOrder: 1 } as unknown as VolunteerArea;
const COMMUNICATION = { id: 'comunicacao', name: 'Comunicação e mídias', sortOrder: 2 } as unknown as VolunteerArea;

function application(overrides: Record<string, unknown> = {}) {
  return {
    id: APPLICATION_ID,
    userId: 'user-1',
    status: 'new',
    message: 'Sou pedagoga e tenho as manhãs de sábado livres.',
    createdAt: new Date('2026-10-09T17:20:00Z'),
    updatedAt: new Date('2026-10-09T17:20:00Z'),
    user: { name: 'Larissa Mendes', email: 'larissa@exemplo.com', phone: '11981234567' },
    areas: [COMMUNICATION, PEDAGOGICAL],
    update: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  } as unknown as VolunteerApplication;
}

function setup(rows: VolunteerApplication[] = [application()], { staff = true }: { staff?: boolean } = {}) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff: staff } as unknown as User);
  jest.spyOn(sequelize, 'transaction').mockImplementation((async (callback: (t: unknown) => unknown) => callback({ LOCK: { UPDATE: 'UPDATE' } })) as never);
  const findAll = jest.spyOn(VolunteerApplication, 'findAll').mockImplementation((async (options?: { raw?: boolean }) =>
    options?.raw
      ? [
          { status: 'new', total: '2' },
          { status: 'ended', total: 1 },
        ]
      : rows) as never);
  const findByPk = jest.spyOn(VolunteerApplication, 'findByPk').mockResolvedValue(rows[0] ?? null);
  const links = jest.spyOn(VolunteerApplicationArea, 'findAll').mockResolvedValue([{ applicationId: APPLICATION_ID }] as never);
  return { findAll, findByPk, links };
}

afterEach(() => jest.restoreAllMocks());

describe('the staff guard on every volunteer route', () => {
  const routes: [string, string, string][] = [
    ['get', BASE, 'list'],
    ['get', `${BASE}/counts`, 'counts'],
    ['get', `${BASE}/export.csv`, 'csv'],
    ['get', `${BASE}/${APPLICATION_ID}`, 'detail'],
    ['patch', `${BASE}/${APPLICATION_ID}/status`, 'status'],
  ];

  it.each(routes)('%s %s answers 401 without a session and reads nothing', async (method, url) => {
    const { findAll, findByPk } = setup();

    const response = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url).send({ status: 'ended' });

    expect(response.status).toBe(401);
    expect(findAll).not.toHaveBeenCalled();
    expect(findByPk).not.toHaveBeenCalled();
  });

  it.each(routes)('%s %s answers 403 to someone who is not staff and touches nothing', async (method, url) => {
    const { findAll, findByPk } = setup([application()], { staff: false });

    const response = await (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url).set(auth).send({ status: 'ended' });

    expect(response.status).toBe(403);
    expect(findAll).not.toHaveBeenCalled();
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/volunteer-applications', () => {
  it('lists the contact data from the profile, the areas in the staff order, and the counts per status', async () => {
    setup();

    const response = await request(app).get(BASE).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data).toEqual([
      {
        id: APPLICATION_ID,
        status: 'new',
        message: 'Sou pedagoga e tenho as manhãs de sábado livres.',
        createdAt: '2026-10-09T17:20:00.000Z',
        updatedAt: '2026-10-09T17:20:00.000Z',
        name: 'Larissa Mendes',
        email: 'larissa@exemplo.com',
        phone: '11981234567',
        areas: [
          { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas' },
          { id: 'comunicacao', name: 'Comunicação e mídias' },
        ],
      },
    ]);
    expect(response.body.counts).toEqual({ all: 3, new: 2, in_contact: 0, volunteering: 0, ended: 1 });
  });

  it('never sends the account id or any other column of the user', async () => {
    setup();

    const { body } = await request(app).get(BASE).set(auth);

    expect(Object.keys(body.data[0]).sort()).toEqual(['areas', 'createdAt', 'email', 'id', 'message', 'name', 'phone', 'status', 'updatedAt']);
  });

  it('asks the database for the status filter, and only that when there is no area', async () => {
    const { findAll, links } = setup();

    await request(app).get(`${BASE}?status=in_contact`).set(auth);

    const listCall = findAll.mock.calls.find(([options]) => !(options as { raw?: boolean } | undefined)?.raw)![0] as { where: Record<string, unknown> };
    expect(listCall.where).toEqual({ status: 'in_contact' });
    expect(links).not.toHaveBeenCalled();
  });

  it('filters by area through the link table, and counts only within that area', async () => {
    const { findAll, links } = setup();

    await request(app).get(`${BASE}?area=acervo&status=new`).set(auth);

    expect(links.mock.calls[0]![0]).toMatchObject({ where: { areaId: 'acervo' } });
    const calls = findAll.mock.calls.map(([options]) => options as { raw?: boolean; where: { id?: Record<symbol, string[]>; status?: string } });
    const list = calls.find((call) => !call.raw)!;
    const counting = calls.find((call) => call.raw)!;
    expect(list.where.status).toBe('new');
    expect(list.where.id![Op.in]).toEqual([APPLICATION_ID]);
    expect(counting.where.id![Op.in]).toEqual([APPLICATION_ID]);
    expect(counting.where.status).toBeUndefined();
  });

  it('orders the queue: new, in contact, volunteering, ended, and the newest first inside each', async () => {
    const at = (id: string, status: string, createdAt: string) => application({ id, status, createdAt: new Date(createdAt), updatedAt: new Date(createdAt) });
    setup([
      at('ended', 'ended', '2026-10-12T10:00:00Z'),
      at('volunteering', 'volunteering', '2026-10-10T10:00:00Z'),
      at('new-old', 'new', '2026-10-01T10:00:00Z'),
      at('in-contact', 'in_contact', '2026-10-08T10:00:00Z'),
      at('new-today', 'new', '2026-10-11T10:00:00Z'),
    ]);

    const { body } = await request(app).get(BASE).set(auth);

    expect(body.data.map((entry: { id: string }) => entry.id)).toEqual(['new-today', 'new-old', 'in-contact', 'volunteering', 'ended']);
  });

  it.each([['status=zzz'], ['status='], ['area=Acervo!'], ['area=../../x']])('refuses the filter %s with 400', async (query) => {
    const { findAll } = setup();

    const response = await request(app).get(`${BASE}?${query}`).set(auth);

    expect(response.status).toBe(400);
    expect(findAll).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/volunteer-applications/counts', () => {
  it('answers the counts and nothing else, with zero for the situations that have no row', async () => {
    setup();

    const response = await request(app).get(`${BASE}/counts`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ counts: { all: 3, new: 2, in_contact: 0, volunteering: 0, ended: 1 } });
  });
});

describe('GET /api/admin/volunteer-applications/:id', () => {
  it('answers one application', async () => {
    setup();

    const response = await request(app).get(`${BASE}/${APPLICATION_ID}`).set(auth);

    expect(response.status).toBe(200);
    expect(response.body.application).toMatchObject({ id: APPLICATION_ID, name: 'Larissa Mendes', email: 'larissa@exemplo.com' });
  });

  it('answers 404 with its own code for an application that does not exist', async () => {
    setup([]);

    const response = await request(app).get(`${BASE}/${APPLICATION_ID}`).set(auth);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('application_not_found');
  });

  it('answers 400 for an identifier that is not a UUID, without asking the database', async () => {
    const { findByPk } = setup();

    const response = await request(app).get(`${BASE}/nao-e-uuid`).set(auth);

    expect(response.status).toBe(400);
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('PATCH /api/admin/volunteer-applications/:id/status', () => {
  it.each(['new', 'in_contact', 'volunteering', 'ended'])('moves to %s, whatever it was before: every transition exists', async (status) => {
    const row = application({ status: 'ended' });
    setup([row]);

    const response = await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send({ status });

    expect(response.status).toBe(200);
    expect(row.update).toHaveBeenCalledWith({ status }, expect.objectContaining({ fields: ['status'] }));
  });

  it('writes the status column and nothing else, even when the body names other columns', async () => {
    const row = application();
    setup([row]);

    await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send({
      status: 'volunteering',
      message: 'trocada pela equipe',
      userId: 'outra-pessoa',
      createdAt: '2020-01-01T00:00:00Z',
      id: 'outro-id',
    });

    const [values, options] = (row.update as jest.Mock).mock.calls[0]!;
    expect(values).toEqual({ status: 'volunteering' });
    expect(options.fields).toEqual(['status']);
  });

  it.each([[{}], [{ status: 'aprovada' }], [{ status: '' }], [{ status: 3 }]])('refuses the body %j with 400 and writes nothing', async (body) => {
    const row = application();
    setup([row]);

    const response = await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send(body);

    expect(response.status).toBe(400);
    expect(row.update).not.toHaveBeenCalled();
  });

  it('answers 404 when the application does not exist', async () => {
    setup([]);

    const response = await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send({ status: 'ended' });

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('application_not_found');
  });

  it('answers 409 when reopening would give the person two live applications', async () => {
    const row = application({ status: 'ended' });
    (row.update as jest.Mock).mockRejectedValue(new UniqueConstraintError({}));
    setup([row]);

    const response = await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send({ status: 'new' });

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('live_application_exists');
  });

  it('locks the row inside a transaction while it changes', async () => {
    const { findByPk } = setup();

    await request(app).patch(`${BASE}/${APPLICATION_ID}/status`).set(auth).send({ status: 'in_contact' });

    expect(findByPk.mock.calls[0]![1]).toMatchObject({ lock: 'UPDATE' });
  });
});

describe('GET /api/admin/volunteer-applications/export.csv', () => {
  it('downloads the queue as a spreadsheet: semicolon, BOM, CRLF, staff labels and the areas joined', async () => {
    setup();

    const response = await request(app).get(`${BASE}/export.csv`).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
    expect(response.headers['content-disposition']).toBe('attachment; filename="voluntarios.csv"');
    expect(response.text.startsWith('﻿Nome;Situação;Áreas;E-mail;Telefone;Mensagem;Candidatou-se em\r\n')).toBe(true);
    expect(response.text).toContain(
      'Larissa Mendes;Nova;Apoio pedagógico e oficinas, Comunicação e mídias;larissa@exemplo.com;(11) 98123-4567;Sou pedagoga e tenho as manhãs de sábado livres.;09/10/2026 14:20\r\n',
    );
  });

  it('applies the same filters as the queue', async () => {
    const { links } = setup();

    await request(app).get(`${BASE}/export.csv?area=acervo`).set(auth);

    expect(links.mock.calls[0]![0]).toMatchObject({ where: { areaId: 'acervo' } });
  });

  it('neutralizes anything a spreadsheet would run as a formula, in every cell a person wrote', () => {
    const csv = applicationsCsv([
      {
        id: 'a',
        status: 'new',
        message: '=HYPERLINK("http://malicioso.example","clique")',
        createdAt: '2026-10-09T17:20:00.000Z',
        updatedAt: '2026-10-09T17:20:00.000Z',
        name: '+cmd|calc',
        email: '@alguem@exemplo.com',
        phone: null,
        areas: [],
      },
    ]);

    const [, line] = csv.split('\r\n');
    const cells = line!.split(';');
    expect(cells[0]).toBe("'+cmd|calc");
    expect(cells[3]).toBe("'@alguem@exemplo.com");
    expect(line).toContain(`"'=HYPERLINK(""http://malicioso.example"",""clique"")"`);
  });

  it('keeps a line break and a quote inside the cell, not in the row', () => {
    const csv = applicationsCsv([
      {
        id: 'a',
        status: 'ended',
        message: 'primeira linha\nsegunda "linha"',
        createdAt: '2026-10-09T17:20:00.000Z',
        updatedAt: '2026-10-09T17:20:00.000Z',
        name: 'Denise Costa',
        email: 'denise@exemplo.com',
        phone: null,
        areas: [{ id: 'acervo', name: 'Organização de acervo' }],
      },
    ]);

    expect(csv).toContain('Denise Costa;Encerrada;Organização de acervo;denise@exemplo.com;;"primeira linha\nsegunda ""linha""";');
  });
});
