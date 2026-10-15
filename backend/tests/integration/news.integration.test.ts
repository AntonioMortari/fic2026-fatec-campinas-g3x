import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { News, RefreshToken, sequelize, User } from '../../src/models';
import { uploadsDir } from '../../src/utils/event-image-storage';

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

const NEWS = {
  kind: 'campaign',
  title: 'Campanha: livros para a biblioteca',
  summary: 'Estamos recebendo livros de autoras e autores negros.',
  body: 'A biblioteca do Ateliê empresta livros.\n\nLivros em bom estado podem ser deixados na sede.',
};

const ALL_BYTES = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ALL_BYTES, Buffer.from([0, 0, 0xff, 0xfe])]);
const upload = (data: Buffer, extra: Record<string, unknown> = {}) => ({ data: data.toString('base64'), alt: 'Pilha de livros infantis sobre uma mesa.', authorized: true, ...extra });

async function signUp(email: string, isStaff: boolean) {
  const response = await request(app).post('/api/auth/register').send({ ...ACCOUNT, email });
  if (isStaff) await User.update({ isStaff: true }, { where: { id: response.body.user.id } });
  return { Authorization: `Bearer ${response.body.token as string}` };
}

const staff = () => signUp('equipe@exemplo.com', true);

async function writeNews(headers: Record<string, string>, extra: Record<string, unknown> = {}, publish = false) {
  const created = await request(app).post('/api/admin/news').set(headers).send({ ...NEWS, ...extra });
  const id = created.body.news.id as string;
  if (publish) await request(app).patch(`/api/admin/news/${id}/publication`).set(headers).send({ published: true });
  return id;
}

const binary = (res: request.Response, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await News.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
  fs.rmSync(uploadsDir(), { recursive: true, force: true });
});

describe('news against a real MySQL', () => {
  it('a draft is invisible to the public until it is published, then listed with an excerpt', async () => {
    const headers = await staff();
    const id = await writeNews(headers);

    expect((await request(app).get('/api/news')).body.data).toEqual([]);
    expect((await request(app).get(`/api/news/${id}`)).status).toBe(404);
    expect((await request(app).get('/api/admin/news').set(headers)).body.data).toHaveLength(1);

    await request(app).patch(`/api/admin/news/${id}/publication`).set(headers).send({ published: true });

    const list = await request(app).get('/api/news');
    expect(list.body.data).toHaveLength(1);
    expect(list.body.data[0]).toMatchObject({ id, kind: 'campaign', excerpt: NEWS.summary });
    const detail = await request(app).get(`/api/news/${id}`);
    expect(detail.body.news.paragraphs).toEqual(['A biblioteca do Ateliê empresta livros.', 'Livros em bom estado podem ser deixados na sede.']);
  });

  it('saving never publishes, even with a hostile body', async () => {
    const headers = await staff();

    const created = await request(app)
      .post('/api/admin/news')
      .set(headers)
      .send({ ...NEWS, published: true, publishedAt: '2020-01-01T00:00:00Z', imageFile: 'x.png' });
    const id = created.body.news.id as string;
    const edited = await request(app).put(`/api/admin/news/${id}`).set(headers).send({ ...NEWS, title: 'Outro título', published: true });

    expect(created.body.news).toMatchObject({ published: false, publishedAt: null, image: null });
    expect(edited.body.news).toMatchObject({ title: 'Outro título', published: false, publishedAt: null });
    expect((await request(app).get('/api/news')).body.data).toEqual([]);
  });

  it('stamps the date once, keeps it when taken down and when published again', async () => {
    const headers = await staff();
    const id = await writeNews(headers);
    const toggle = (published: boolean) => request(app).patch(`/api/admin/news/${id}/publication`).set(headers).send({ published });

    const first = (await toggle(true)).body.news.publishedAt as string;
    expect(first).toBeTruthy();
    const down = (await toggle(false)).body.news;
    expect(down).toMatchObject({ published: false, publishedAt: first });
    expect((await request(app).get(`/api/news/${id}`)).status).toBe(404);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect((await toggle(true)).body.news.publishedAt).toBe(first);
  });

  it('orders the public list by publication date, newest first', async () => {
    const headers = await staff();
    const older = await writeNews(headers, { title: 'Antiga' }, true);
    await News.update({ publishedAt: new Date('2026-01-01T12:00:00Z') }, { where: { id: older } });
    const newer = await writeNews(headers, { title: 'Nova' }, true);

    expect((await request(app).get('/api/news')).body.data.map((item: { id: string }) => item.id)).toEqual([newer, older]);
  });

  it('keeps the accents and emoji of the text', async () => {
    const headers = await staff();
    const id = await writeNews(headers, { title: 'Oração à Cabaça 🥁', body: 'Cafú e o Café — ação.' }, true);

    const detail = await request(app).get(`/api/news/${id}`);

    expect(detail.body.news.title).toBe('Oração à Cabaça 🥁');
    expect(detail.body.news.paragraphs).toEqual(['Cafú e o Café — ação.']);
  });

  it('blocks everyone who is not staff: 401 without a session, 403 for a plain account', async () => {
    const plain = await signUp('comum@exemplo.com', false);
    const id = await writeNews(await staff());

    expect((await request(app).get('/api/admin/news')).status).toBe(401);
    expect((await request(app).get('/api/admin/news').set(plain)).status).toBe(403);
    expect((await request(app).post('/api/admin/news').set(plain).send(NEWS)).status).toBe(403);
    expect((await request(app).patch(`/api/admin/news/${id}/publication`).set(plain).send({ published: true })).status).toBe(403);
    expect((await request(app).put(`/api/admin/news/${id}/image`).set(plain).send(upload(PNG))).status).toBe(403);
    expect((await News.findByPk(id))?.published).toBe(false);
  });

  it('has no DELETE for the piece itself', async () => {
    const headers = await staff();
    const id = await writeNews(headers);
    expect((await request(app).delete(`/api/admin/news/${id}`).set(headers)).status).toBe(404);
    expect(await News.count()).toBe(1);
  });
});

describe('the optional image against a real MySQL', () => {
  it('round trips the exact bytes, hides the draft image from the public and shows it to staff', async () => {
    const headers = await staff();
    const id = await writeNews(headers);

    const saved = await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(PNG));
    expect(saved.status).toBe(200);
    expect(saved.body.news.image.alt).toBe('Pilha de livros infantis sobre uma mesa.');

    expect((await request(app).get(`/api/news/${id}/image`)).status).toBe(404);
    const forStaff = await request(app).get(`/api/admin/news/${id}/image`).set(headers).buffer(true).parse(binary);
    expect(Buffer.compare(forStaff.body as Buffer, PNG)).toBe(0);

    await request(app).patch(`/api/admin/news/${id}/publication`).set(headers).send({ published: true });
    const publicly = await request(app).get(`/api/news/${id}/image`).buffer(true).parse(binary);
    expect(publicly.status).toBe(200);
    expect(publicly.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(publicly.body as Buffer, PNG)).toBe(0);
    expect((await request(app).get('/api/news')).body.data[0].image.url).toMatch(new RegExp(`^/api/news/${id}/image\\?v=\\d+$`));
  });

  it('refuses without the declaration or the description, and the database holds the same line', async () => {
    const headers = await staff();
    const id = await writeNews(headers);

    expect((await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(PNG, { authorized: false }))).status).toBe(400);
    expect((await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(PNG, { alt: ' ' }))).status).toBe(400);
    expect((await News.findByPk(id))?.imageFile).toBeNull();

    await expect(
      sequelize.query('UPDATE news SET image_file = ?, image_mime = ? WHERE id = ?', { replacements: [`${randomUUID()}.png`, 'image/png', id] }),
    ).rejects.toThrow(/news_image_all_or_nothing/);
  });

  it('records the declaration as a date, replaces the file and deletes the old one, and removing clears everything', async () => {
    const headers = await staff();
    const id = await writeNews(headers);
    await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(PNG));
    const first = (await News.findByPk(id))!;
    expect(first.imageAuthorizedAt).toBeInstanceOf(Date);

    await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(PNG));
    const second = (await News.findByPk(id))!;
    expect(second.imageFile).not.toBe(first.imageFile);
    expect(fs.existsSync(path.join(uploadsDir(), first.imageFile!))).toBe(false);
    expect(fs.existsSync(path.join(uploadsDir(), second.imageFile!))).toBe(true);

    const removed = await request(app).delete(`/api/admin/news/${id}/image`).set(headers);
    expect(removed.body.news.image).toBeNull();
    const row = (await News.findByPk(id))!;
    expect([row.imageFile, row.imageMime, row.imageAlt, row.imageAuthorizedAt, row.imageUpdatedAt]).toEqual([null, null, null, null, null]);
    expect(fs.existsSync(path.join(uploadsDir(), second.imageFile!))).toBe(false);
  });

  it('refuses text with a photo name, and more than 4 MB', async () => {
    const headers = await staff();
    const id = await writeNews(headers);

    expect((await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(Buffer.from('foto.jpg')))).status).toBe(400);
    const tooBig = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024)]);
    expect((await request(app).put(`/api/admin/news/${id}/image`).set(headers).send(upload(tooBig))).status).toBe(413);
    expect((await News.findByPk(id))?.imageFile).toBeNull();
  });
});
