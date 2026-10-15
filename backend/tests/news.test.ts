import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../src/app';
import { News, User } from '../src/models';
import { toParagraphs } from '../src/services/news.service';
import { STORED_NAME_PATTERN, uploadsDir } from '../src/utils/event-image-storage';
import { signToken } from '../src/utils/token';

const app = createApp();

const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const NEWS_ID = '55555555-5555-4555-8555-555555555555';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('resto do arquivo')]);
const FAKE_JPG = Buffer.from('isto é só texto, com nome de foto.jpg');

const validNews = { kind: 'news', title: 'Novembro é Mês da Consciência Negra', summary: 'Contações e oficinas.', body: 'Primeiro parágrafo.\n\nSegundo parágrafo.' };
const imageBody = (data: Buffer, extra: Record<string, unknown> = {}) => ({ data: data.toString('base64'), alt: 'Crianças em roda ouvindo uma história.', authorized: true, ...extra });

function row(overrides: Record<string, unknown> = {}) {
  const base = {
    id: NEWS_ID,
    kind: 'news',
    title: 'Novembro é Mês da Consciência Negra',
    summary: 'Contações e oficinas.',
    body: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
    published: true,
    publishedAt: new Date('2026-10-11T15:00:00Z'),
    imageFile: null,
    imageMime: null,
    imageAlt: null,
    imageAuthorizedAt: null,
    imageUpdatedAt: null,
    createdAt: new Date('2026-10-10T12:00:00Z'),
    updatedAt: new Date('2026-10-10T12:00:00Z'),
    ...overrides,
  };
  const instance = { ...base } as Record<string, unknown>;
  instance.update = jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(instance, values));
  return instance as unknown as News & { update: jest.Mock };
}

function asStaff(isStaff = true) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff } as unknown as User);
}

const planted = () => {
  fs.mkdirSync(uploadsDir(), { recursive: true });
  const name = `${randomUUID()}.png`;
  fs.writeFileSync(path.join(uploadsDir(), name), PNG);
  return name;
};
const filesInDir = () => (fs.existsSync(uploadsDir()) ? fs.readdirSync(uploadsDir()) : []);

afterEach(() => jest.restoreAllMocks());
afterAll(() => fs.rmSync(uploadsDir(), { recursive: true, force: true }));

describe('toParagraphs', () => {
  it('splits on blank lines, trims and drops empties', () => {
    expect(toParagraphs('Um.\n\n  Dois.  \r\n\r\n\n\nTrês.')).toEqual(['Um.', 'Dois.', 'Três.']);
    expect(toParagraphs('Uma linha\nquebrada só.')).toEqual(['Uma linha\nquebrada só.']);
  });
});

describe('GET /api/news (public)', () => {
  it('asks only for published rows, newest first, and answers the excerpt without the body', async () => {
    const findAll = jest.spyOn(News, 'findAll').mockResolvedValue([row(), row({ id: randomUUID(), summary: null })]);

    const response = await request(app).get('/api/news');

    expect(response.status).toBe(200);
    expect(findAll.mock.calls[0]![0]).toMatchObject({ where: { published: true }, order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']] });
    expect(response.body.data[0]).toEqual({
      id: NEWS_ID,
      kind: 'news',
      title: 'Novembro é Mês da Consciência Negra',
      excerpt: 'Contações e oficinas.',
      publishedAt: '2026-10-11T15:00:00.000Z',
      image: null,
    });
    expect(response.body.data[1].excerpt).toBe('Primeiro parágrafo.');
    expect(JSON.stringify(response.body)).not.toContain('Segundo parágrafo');
  });

  it('points at the public image with a version and the stored description', async () => {
    jest.spyOn(News, 'findAll').mockResolvedValue([row({ imageFile: 'x', imageAlt: 'Uma foto', imageUpdatedAt: new Date('2026-10-12T12:00:00.123Z') })]);

    const response = await request(app).get('/api/news');

    expect(response.body.data[0].image).toEqual({ url: `/api/news/${NEWS_ID}/image?v=${new Date('2026-10-12T12:00:00.123Z').getTime()}`, alt: 'Uma foto' });
  });
});

describe('GET /api/news/:id (public)', () => {
  it('returns the published piece with its text in paragraphs', async () => {
    const findOne = jest.spyOn(News, 'findOne').mockResolvedValue(row());

    const response = await request(app).get(`/api/news/${NEWS_ID}`);

    expect(response.status).toBe(200);
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: NEWS_ID, published: true });
    expect(response.body.news.paragraphs).toEqual(['Primeiro parágrafo.', 'Segundo parágrafo.']);
    expect(response.body.news.summary).toBe('Contações e oficinas.');
    expect(response.body.news).not.toHaveProperty('published');
  });

  it('answers 404 for a draft or a missing piece, and 400 for a malformed id', async () => {
    jest.spyOn(News, 'findOne').mockResolvedValue(null);

    const missing = await request(app).get(`/api/news/${NEWS_ID}`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('news_not_found');
    expect((await request(app).get('/api/news/nao-e-um-id')).status).toBe(400);
  });
});

describe('GET /api/news/:id/image (public)', () => {
  it('serves the stored bytes only for a published piece', async () => {
    const findOne = jest.spyOn(News, 'findOne').mockResolvedValue(row({ imageFile: planted(), imageMime: 'image/png', imageUpdatedAt: new Date('2026-10-12T12:00:00Z') }));

    const response = await request(app).get(`/api/news/${NEWS_ID}/image`).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    expect(Buffer.compare(response.body as Buffer, PNG)).toBe(0);
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: NEWS_ID, published: true });
  });

  it('answers 404 when the piece has no image or is not published', async () => {
    jest.spyOn(News, 'findOne').mockResolvedValue(null);
    expect((await request(app).get(`/api/news/${NEWS_ID}/image`)).status).toBe(404);
  });
});

describe('the staff guard on every admin news route', () => {
  const routes: [string, string][] = [
    ['get', '/api/admin/news'],
    ['post', '/api/admin/news'],
    ['get', `/api/admin/news/${NEWS_ID}`],
    ['put', `/api/admin/news/${NEWS_ID}`],
    ['patch', `/api/admin/news/${NEWS_ID}/publication`],
    ['get', `/api/admin/news/${NEWS_ID}/image`],
    ['put', `/api/admin/news/${NEWS_ID}/image`],
    ['delete', `/api/admin/news/${NEWS_ID}/image`],
  ];
  const call = (method: string, url: string) => (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url);

  it.each(routes)('%s %s answers 401 without a session and touches nothing', async (method, url) => {
    const touched = [jest.spyOn(News, 'findAll'), jest.spyOn(News, 'findByPk'), jest.spyOn(News, 'findOne'), jest.spyOn(News, 'create'), jest.spyOn(News, 'update')];
    const response = await call(method, url).send({});
    expect(response.status).toBe(401);
    for (const spy of touched) expect(spy).not.toHaveBeenCalled();
  });

  it.each(routes)('%s %s answers 403 to someone who is not staff and touches nothing', async (method, url) => {
    asStaff(false);
    const touched = [jest.spyOn(News, 'findAll'), jest.spyOn(News, 'findByPk'), jest.spyOn(News, 'findOne'), jest.spyOn(News, 'create'), jest.spyOn(News, 'update')];
    const response = await call(method, url).set(auth).send(imageBody(PNG));
    expect(response.status).toBe(403);
    for (const spy of touched) expect(spy).not.toHaveBeenCalled();
  });
});

describe('admin news: writing', () => {
  it('lists drafts too and never caches', async () => {
    asStaff();
    jest.spyOn(News, 'findAll').mockResolvedValue([row({ published: false, publishedAt: null })]);

    const response = await request(app).get('/api/admin/news').set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data[0]).toMatchObject({ published: false, publishedAt: null, body: 'Primeiro parágrafo.\n\nSegundo parágrafo.' });
  });

  it('creates a draft and ignores everything the form never sends: published, publishedAt, id, image columns', async () => {
    asStaff();
    const create = jest.spyOn(News, 'create').mockResolvedValue(row({ published: false, publishedAt: null }));

    const response = await request(app)
      .post('/api/admin/news')
      .set(auth)
      .send({ ...validNews, published: true, publishedAt: '2020-01-01T00:00:00Z', id: randomUUID(), imageFile: 'x.png', imageAuthorizedAt: '2020-01-01' });

    expect(response.status).toBe(201);
    expect(create.mock.calls[0]![0]).toEqual({ kind: 'news', title: validNews.title, summary: validNews.summary, body: validNews.body, published: false });
    expect(response.body.news.published).toBe(false);
  });

  it('defaults the kind to news, turns a blank summary into null and normalises line breaks', async () => {
    asStaff();
    const create = jest.spyOn(News, 'create').mockResolvedValue(row());

    await request(app).post('/api/admin/news').set(auth).send({ title: '  Campanha  ', summary: '   ', body: 'Um.\r\n\r\nDois.' });

    expect(create.mock.calls[0]![0]).toMatchObject({ kind: 'news', title: 'Campanha', summary: null, body: 'Um.\n\nDois.' });
  });

  it.each([
    [{ ...validNews, title: '' }, 'title'],
    [{ ...validNews, title: 'a'.repeat(201) }, 'title'],
    [{ ...validNews, body: '   ' }, 'body'],
    [{ ...validNews, summary: 'a'.repeat(501) }, 'summary'],
    [{ ...validNews, kind: 'anuncio' }, 'kind'],
  ])('refuses %j naming the %s field', async (body, field) => {
    asStaff();
    const create = jest.spyOn(News, 'create');

    const response = await request(app).post('/api/admin/news').set(auth).send(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toContain(field);
    expect(create).not.toHaveBeenCalled();
  });

  it('saving writes four columns only and never touches publication', async () => {
    asStaff();
    const existing = row({ published: true });
    jest.spyOn(News, 'findByPk').mockResolvedValue(existing);

    const response = await request(app)
      .put(`/api/admin/news/${NEWS_ID}`)
      .set(auth)
      .send({ ...validNews, title: 'Título corrigido', published: false, publishedAt: null });

    expect(response.status).toBe(200);
    const [values, options] = existing.update.mock.calls[0]!;
    expect(Object.keys(values).sort()).toEqual(['body', 'kind', 'summary', 'title']);
    expect(options).toEqual({ fields: ['kind', 'title', 'summary', 'body'] });
    expect(response.body.news.published).toBe(true);
  });

  it('answers 404 when the piece to correct does not exist', async () => {
    asStaff();
    jest.spyOn(News, 'findByPk').mockResolvedValue(null);
    const response = await request(app).put(`/api/admin/news/${NEWS_ID}`).set(auth).send(validNews);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('news_not_found');
  });
});

describe('admin news: publication is a separate act', () => {
  const publish = (published: unknown) => request(app).patch(`/api/admin/news/${NEWS_ID}/publication`).set(auth).send({ published });

  it('stamps the date on the first publication', async () => {
    asStaff();
    const draft = row({ published: false, publishedAt: null });
    jest.spyOn(News, 'findByPk').mockResolvedValue(draft);

    const response = await publish(true);

    expect(response.status).toBe(200);
    const [values, options] = draft.update.mock.calls[0]!;
    expect(values.published).toBe(true);
    expect(values.publishedAt).toBeInstanceOf(Date);
    expect(options).toEqual({ fields: ['published', 'publishedAt'] });
  });

  it('keeps the original date when it is published again', async () => {
    asStaff();
    const taken = row({ published: false, publishedAt: new Date('2026-10-11T15:00:00Z') });
    jest.spyOn(News, 'findByPk').mockResolvedValue(taken);

    const response = await publish(true);

    expect(taken.update.mock.calls[0]).toEqual([{ published: true }, { fields: ['published'] }]);
    expect(response.body.news.publishedAt).toBe('2026-10-11T15:00:00.000Z');
  });

  it('keeps the date when taking it down', async () => {
    asStaff();
    const live = row();
    jest.spyOn(News, 'findByPk').mockResolvedValue(live);

    const response = await publish(false);

    expect(live.update.mock.calls[0]).toEqual([{ published: false }, { fields: ['published'] }]);
    expect(response.body.news).toMatchObject({ published: false, publishedAt: '2026-10-11T15:00:00.000Z' });
  });

  it.each([[undefined], ['true'], [1]])('refuses %p as the answer', async (value) => {
    asStaff();
    const findByPk = jest.spyOn(News, 'findByPk');
    expect((await publish(value)).status).toBe(400);
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('admin news: the optional image (RN07)', () => {
  const put = (body: unknown) => request(app).put(`/api/admin/news/${NEWS_ID}/image`).set(auth).send(body as object);

  function setup(current: Record<string, unknown> = {}) {
    asStaff();
    const update = jest.spyOn(News, 'update').mockResolvedValue([1]);
    jest.spyOn(News, 'findByPk').mockResolvedValue(row({ imageFile: null, ...current }));
    return update;
  }

  it('stores the bytes on disk and saves the declaration as a date, with the description', async () => {
    const update = setup();
    const before = filesInDir().length;

    const response = await put(imageBody(PNG));

    expect(response.status).toBe(200);
    const [values, options] = update.mock.calls[0]!;
    expect(values.imageFile).toMatch(STORED_NAME_PATTERN);
    expect(values).toMatchObject({ imageMime: 'image/png', imageAlt: 'Crianças em roda ouvindo uma história.' });
    expect(values.imageAuthorizedAt).toBeInstanceOf(Date);
    expect(options).toMatchObject({ where: { id: NEWS_ID } });
    expect(filesInDir()).toHaveLength(before + 1);
  });

  it.each([
    ['without the authorization declaration', imageBody(PNG, { authorized: undefined }), 'authorized'],
    ['with the declaration as false', imageBody(PNG, { authorized: false }), 'authorized'],
    ['with the declaration as text', imageBody(PNG, { authorized: 'true' }), 'authorized'],
    ['without a description', imageBody(PNG, { alt: '   ' }), 'alt'],
    ['with data that is not base64', imageBody(PNG, { data: '***' }), 'data'],
  ])('refuses an image %s and writes nothing', async (_label, body, field) => {
    const update = setup();
    const before = filesInDir().length;

    const response = await put(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toContain(field);
    expect(update).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it('reads the bytes, not the name: text pretending to be a photo is refused', async () => {
    const update = setup();
    const response = await put(imageBody(FAKE_JPG));
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_image');
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses more than 4 MB with 413', async () => {
    const update = setup();
    const response = await put(imageBody(Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024)])));
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('image_too_large');
    expect(update).not.toHaveBeenCalled();
  });

  it('removes the previous file when a new one replaces it', async () => {
    const old = planted();
    setup({ imageFile: old });

    await put(imageBody(PNG));

    expect(fs.existsSync(path.join(uploadsDir(), old))).toBe(false);
  });

  it('clears all five columns and deletes the file on removal', async () => {
    const old = planted();
    const update = setup({ imageFile: old });

    const response = await request(app).delete(`/api/admin/news/${NEWS_ID}/image`).set(auth);

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]![0]).toEqual({ imageFile: null, imageMime: null, imageAlt: null, imageAuthorizedAt: null, imageUpdatedAt: null });
    expect(fs.existsSync(path.join(uploadsDir(), old))).toBe(false);
  });

  it('lets staff see the image of a draft, uncached', async () => {
    asStaff();
    jest.spyOn(News, 'findOne').mockResolvedValue(row({ published: false, imageFile: planted(), imageMime: 'image/png', imageUpdatedAt: new Date() }));

    const response = await request(app).get(`/api/admin/news/${NEWS_ID}/image`).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });
});
