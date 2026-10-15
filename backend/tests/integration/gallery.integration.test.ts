import { randomUUID } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { GalleryPhoto, RefreshToken, sequelize, User } from '../../src/models';
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

const ALL_BYTES = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ALL_BYTES, Buffer.from([0, 0, 0xff, 0xfe])]);
const body = (extra: Record<string, unknown> = {}) => ({
  data: PNG.toString('base64'),
  album: 'II Festa Preta',
  alt: 'Homem de camiseta amarela toca atabaque.',
  authorized: true,
  ...extra,
});

async function signUp(email: string, isStaff: boolean) {
  const response = await request(app).post('/api/auth/register').send({ ...ACCOUNT, email });
  if (isStaff) await User.update({ isStaff: true }, { where: { id: response.body.user.id } });
  return { Authorization: `Bearer ${response.body.token as string}` };
}

const staff = () => signUp('equipe@exemplo.com', true);

async function upload(headers: Record<string, string>, extra: Record<string, unknown> = {}, publish = false) {
  const created = await request(app).post('/api/admin/gallery').set(headers).send(body(extra));
  const id = created.body.photo.id as string;
  if (publish) await request(app).patch(`/api/admin/gallery/${id}/publication`).set(headers).send({ published: true });
  return id;
}

const binary = (res: request.Response, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

const fileOf = async (id: string) => path.join(uploadsDir(), (await GalleryPhoto.findByPk(id))!.imageFile);

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await GalleryPhoto.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
  fs.rmSync(uploadsDir(), { recursive: true, force: true });
});

describe('the gallery against a real MySQL', () => {
  it('an uploaded photo is invisible to the public until it is published, file included', async () => {
    const headers = await staff();
    const id = await upload(headers);

    expect((await request(app).get('/api/gallery')).body.data).toEqual([]);
    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(404);
    expect((await request(app).get('/api/admin/gallery').set(headers)).body.data).toHaveLength(1);

    await request(app).patch(`/api/admin/gallery/${id}/publication`).set(headers).send({ published: true });

    const albums = (await request(app).get('/api/gallery')).body.data;
    expect(albums).toHaveLength(1);
    expect(albums[0]).toMatchObject({ name: 'II Festa Preta' });
    expect(albums[0].photos[0].url).toMatch(new RegExp(`^/api/gallery/${id}/image\\?v=\\d+$`));
    const served = await request(app).get(`/api/gallery/${id}/image`).buffer(true).parse(binary);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe('image/png');
    expect(Buffer.compare(served.body as Buffer, PNG)).toBe(0);
  });

  it('taking a photo down closes the file for the public at once, and staff still see it', async () => {
    const headers = await staff();
    const id = await upload(headers, {}, true);
    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(200);

    const down = await request(app).patch(`/api/admin/gallery/${id}/publication`).set(headers).send({ published: false });

    expect(down.body.photo).toMatchObject({ state: 'stored', published: false });
    expect(down.body.photo.publishedAt).toBeTruthy();
    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(404);
    expect((await request(app).get('/api/gallery')).body.data).toEqual([]);
    const forStaff = await request(app).get(`/api/admin/gallery/${id}/image`).set(headers).buffer(true).parse(binary);
    expect(forStaff.status).toBe(200);
    expect(Buffer.compare(forStaff.body as Buffer, PNG)).toBe(0);
  });

  it('uploading never publishes, even with a hostile body', async () => {
    const headers = await staff();

    const created = await request(app)
      .post('/api/admin/gallery')
      .set(headers)
      .send(body({ published: true, publishedAt: '2020-01-01T00:00:00Z', id: randomUUID(), imageFile: 'x.png', authorizedAt: '2020-01-01T00:00:00Z' }));

    expect(created.status).toBe(201);
    expect(created.body.photo).toMatchObject({ published: false, publishedAt: null, state: 'stored' });
    expect((await request(app).get('/api/gallery')).body.data).toEqual([]);
  });

  it('keeps a photo uploaded without the declaration, and neither the API nor the database lets it go public', async () => {
    const headers = await staff();
    const id = await upload(headers, { authorized: false });

    const list = (await request(app).get('/api/admin/gallery').set(headers)).body.data;
    expect(list[0]).toMatchObject({ state: 'unauthorized', authorized: false });

    const refused = await request(app).patch(`/api/admin/gallery/${id}/publication`).set(headers).send({ published: true });
    expect(refused.status).toBe(409);
    expect(refused.body.error.code).toBe('authorization_missing');

    await expect(sequelize.query('UPDATE gallery_photos SET published = 1 WHERE id = ?', { replacements: [id] })).rejects.toThrow(/gallery_photos_published_needs_authorization/);
    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(404);
    expect((await request(app).get('/api/gallery')).body.data).toEqual([]);
  });

  it('records the declaration as a date, and the database refuses a bad file name or mime', async () => {
    const headers = await staff();
    const id = await upload(headers);
    expect((await GalleryPhoto.findByPk(id))!.authorizedAt).toBeInstanceOf(Date);

    await expect(sequelize.query('UPDATE gallery_photos SET image_file = ? WHERE id = ?', { replacements: ['../../etc/passwd', id] })).rejects.toThrow(/gallery_photos_image_valid/);
    await expect(sequelize.query('UPDATE gallery_photos SET image_mime = ? WHERE id = ?', { replacements: ['text/html', id] })).rejects.toThrow(/gallery_photos_image_valid/);
  });

  it('stamps the date once and keeps it when taken down and published again', async () => {
    const headers = await staff();
    const id = await upload(headers);
    const toggle = (published: boolean) => request(app).patch(`/api/admin/gallery/${id}/publication`).set(headers).send({ published });

    const first = (await toggle(true)).body.photo.publishedAt as string;
    expect(first).toBeTruthy();
    expect((await toggle(false)).body.photo.publishedAt).toBe(first);
    await new Promise((resolve) => setTimeout(resolve, 1100));
    expect((await toggle(true)).body.photo.publishedAt).toBe(first);
  });

  it('editing the text keeps the file, the declaration and the publication exactly as they were', async () => {
    const headers = await staff();
    const id = await upload(headers, { caption: 'Antiga.' }, true);
    const before = (await GalleryPhoto.findByPk(id))!.toJSON();
    const bytesBefore = fs.readFileSync(await fileOf(id));

    const response = await request(app)
      .put(`/api/admin/gallery/${id}`)
      .set(headers)
      .send({ album: 'II Festa Preta 🥁', alt: 'Roda de tambor, com acento: coração.', caption: null, published: false, authorized: false, imageFile: 'x.png', authorizedAt: null });

    expect(response.status).toBe(200);
    const after = (await GalleryPhoto.findByPk(id))!.toJSON();
    expect(after).toMatchObject({ album: 'II Festa Preta 🥁', alt: 'Roda de tambor, com acento: coração.', caption: null });
    for (const column of ['published', 'publishedAt', 'authorizedAt', 'imageFile', 'imageMime', 'imageUpdatedAt', 'createdAt'] as const) expect(after[column]).toEqual(before[column]);
    expect(fs.readFileSync(await fileOf(id)).equals(bytesBefore)).toBe(true);
    const pub = await request(app).get('/api/gallery');
    expect(pub.body.data[0].name).toBe('II Festa Preta 🥁');
  });

  it('answers 404 when editing a photo that does not exist', async () => {
    const headers = await staff();
    const res = await request(app).put(`/api/admin/gallery/${randomUUID()}`).set(headers).send({ album: 'A', alt: 'B' });
    expect(res.status).toBe(404);
  });

  it('groups published photos by album ignoring case, and orders the albums newest first', async () => {
    const headers = await staff();
    const old = await upload(headers, { album: 'Cafú e o Café' }, true);
    await GalleryPhoto.update({ publishedAt: new Date('2026-01-01T12:00:00Z') }, { where: { id: old } });
    const a = await upload(headers, { album: 'II Festa Preta' }, true);
    const b = await upload(headers, { album: 'ii festa preta', alt: 'Outra foto.' }, true);
    await upload(headers, { album: 'Guardada' });

    const albums = (await request(app).get('/api/gallery')).body.data as { name: string; photos: { id: string }[] }[];

    expect(albums.map((album) => album.name)).toEqual(['II Festa Preta', 'Cafú e o Café']);
    expect(albums[0]!.photos.map((photo) => photo.id)).toEqual([a, b]);
  });

  it('keeps the accents and emoji of the texts', async () => {
    const headers = await staff();
    await upload(headers, { album: 'Oração à Cabaça 🥁', alt: 'Cafú e o Café — ação.', caption: 'Lançamento “ao vivo”.' }, true);

    const photo = (await request(app).get('/api/gallery')).body.data[0];

    expect(photo.name).toBe('Oração à Cabaça 🥁');
    expect(photo.photos[0]).toMatchObject({ alt: 'Cafú e o Café — ação.', caption: 'Lançamento “ao vivo”.' });
  });

  it('blocks everyone who is not staff: 401 without a session, 403 for a plain account', async () => {
    const plain = await signUp('comum@exemplo.com', false);
    const id = await upload(await staff());

    expect((await request(app).get('/api/admin/gallery')).status).toBe(401);
    expect((await request(app).get('/api/admin/gallery').set(plain)).status).toBe(403);
    expect((await request(app).post('/api/admin/gallery').set(plain).send(body())).status).toBe(403);
    expect((await request(app).patch(`/api/admin/gallery/${id}/publication`).set(plain).send({ published: true })).status).toBe(403);
    expect((await request(app).get(`/api/admin/gallery/${id}/image`).set(plain)).status).toBe(403);
    expect((await request(app).delete(`/api/admin/gallery/${id}`).set(plain)).status).toBe(403);
    expect((await request(app).put(`/api/admin/gallery/${id}`).set(plain).send({ album: 'X', alt: 'Y' })).status).toBe(403);
    expect((await request(app).put(`/api/admin/gallery/${id}`).send({ album: 'X', alt: 'Y' })).status).toBe(401);
    expect((await GalleryPhoto.findByPk(id))?.album).toBe('II Festa Preta');
    expect((await GalleryPhoto.findByPk(id))?.published).toBe(false);
    expect(await GalleryPhoto.count()).toBe(1);
  });
});

describe('the files against a real MySQL', () => {
  it('round trips the exact bytes and stores the file under a generated name', async () => {
    const headers = await staff();
    const id = await upload(headers);

    expect(Buffer.compare(fs.readFileSync(await fileOf(id)), PNG)).toBe(0);
    expect((await GalleryPhoto.findByPk(id))!.imageFile).toMatch(/^[0-9a-f-]{36}\.png$/);
  });

  it('deleting removes the row and the file, and every address stops working', async () => {
    const headers = await staff();
    const id = await upload(headers, {}, true);
    const file = await fileOf(id);
    expect(fs.existsSync(file)).toBe(true);

    const removed = await request(app).delete(`/api/admin/gallery/${id}`).set(headers);

    expect(removed.status).toBe(204);
    expect(fs.existsSync(file)).toBe(false);
    expect(await GalleryPhoto.count()).toBe(0);
    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(404);
    expect((await request(app).get(`/api/admin/gallery/${id}/image`).set(headers)).status).toBe(404);
    expect((await request(app).delete(`/api/admin/gallery/${id}`).set(headers)).status).toBe(404);
  });

  it('refuses text with a photo name, and more than 4 MB, leaving no row and no file', async () => {
    const headers = await staff();
    const before = fs.existsSync(uploadsDir()) ? fs.readdirSync(uploadsDir()).length : 0;

    const fake = await request(app).post('/api/admin/gallery').set(headers).send(body({ data: Buffer.from('foto.jpg').toString('base64') }));
    const tooBig = await request(app)
      .post('/api/admin/gallery')
      .set(headers)
      .send(body({ data: Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024)]).toString('base64') }));

    expect(fake.status).toBe(400);
    expect(tooBig.status).toBe(413);
    expect(await GalleryPhoto.count()).toBe(0);
    expect(fs.existsSync(uploadsDir()) ? fs.readdirSync(uploadsDir()).length : 0).toBe(before);
  });

  it('accepts a photo just under 4 MB through the real JSON parser', async () => {
    const headers = await staff();
    const near = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024 - PNG.length)]);

    const response = await request(app).post('/api/admin/gallery').set(headers).send(body({ data: near.toString('base64') }));

    expect(response.status).toBe(201);
  });

  it('does not serve a file that went missing from the disk', async () => {
    const headers = await staff();
    const id = await upload(headers, {}, true);
    fs.rmSync(await fileOf(id));

    expect((await request(app).get(`/api/gallery/${id}/image`)).status).toBe(404);
  });
});
