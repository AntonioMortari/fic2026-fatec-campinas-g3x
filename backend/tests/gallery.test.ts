import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { Op } from 'sequelize';
import request from 'supertest';
import { createApp } from '../src/app';
import { GalleryPhoto, User } from '../src/models';
import { STORED_NAME_PATTERN, uploadsDir } from '../src/utils/event-image-storage';
import { signToken } from '../src/utils/token';

const app = createApp();

const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const PHOTO_ID = '66666666-6666-4666-8666-666666666666';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('resto do arquivo')]);
const FAKE_JPG = Buffer.from('isto é só texto, com nome de foto.jpg');

const upload = (data: Buffer, extra: Record<string, unknown> = {}) => ({
  data: data.toString('base64'),
  album: 'II Festa Preta',
  alt: 'Homem de camiseta amarela toca atabaque.',
  authorized: true,
  ...extra,
});

function row(overrides: Record<string, unknown> = {}) {
  const base = {
    id: PHOTO_ID,
    album: 'II Festa Preta',
    alt: 'Homem de camiseta amarela toca atabaque.',
    caption: null,
    imageFile: `${randomUUID()}.png`,
    imageMime: 'image/png',
    imageUpdatedAt: new Date('2026-10-12T12:00:00.123Z'),
    authorizedAt: new Date('2026-10-12T12:00:00Z'),
    published: true,
    publishedAt: new Date('2026-10-13T15:00:00Z'),
    createdAt: new Date('2026-10-12T12:00:00Z'),
    updatedAt: new Date('2026-10-12T12:00:00Z'),
    ...overrides,
  };
  const instance = { ...base } as Record<string, unknown>;
  instance.update = jest.fn().mockImplementation(async (values: Record<string, unknown>) => Object.assign(instance, values));
  instance.destroy = jest.fn().mockResolvedValue(undefined);
  return instance as unknown as GalleryPhoto & { update: jest.Mock; destroy: jest.Mock };
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
const binary = (res: request.Response, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

afterEach(() => jest.restoreAllMocks());
afterAll(() => fs.rmSync(uploadsDir(), { recursive: true, force: true }));

describe('GET /api/gallery (public)', () => {
  it('asks only for published photos whose authorization was declared', async () => {
    const findAll = jest.spyOn(GalleryPhoto, 'findAll').mockResolvedValue([]);

    const response = await request(app).get('/api/gallery');

    expect(response.status).toBe(200);
    expect(response.body.data).toEqual([]);
    expect(findAll.mock.calls[0]![0]!.where).toEqual({ published: true, authorizedAt: { [Op.ne]: null } });
  });

  it('groups photos by album name, newest album first, and never answers staff-only fields', async () => {
    jest.spyOn(GalleryPhoto, 'findAll').mockResolvedValue([
      row({ id: 'a1', album: 'Cafú e o Café', caption: 'Lançamento.', publishedAt: new Date('2026-09-12T12:00:00Z') }),
      row({ id: 'b1', album: 'A Cabaça e o Canto Ancestral', publishedAt: new Date('2026-10-01T12:00:00Z') }),
      row({ id: 'b2', album: 'a cabaça e o canto ancestral', publishedAt: new Date('2026-10-02T12:00:00Z') }),
    ]);

    const response = await request(app).get('/api/gallery');

    expect(response.body.data.map((album: { name: string }) => album.name)).toEqual(['A Cabaça e o Canto Ancestral', 'Cafú e o Café']);
    expect(response.body.data[0].photos.map((photo: { id: string }) => photo.id)).toEqual(['b1', 'b2']);
    expect(response.body.data[1].photos[0]).toEqual({
      id: 'a1',
      alt: 'Homem de camiseta amarela toca atabaque.',
      caption: 'Lançamento.',
      url: `/api/gallery/a1/image?v=${new Date('2026-10-12T12:00:00.123Z').getTime()}`,
      publishedAt: '2026-09-12T12:00:00.000Z',
    });
    const text = JSON.stringify(response.body);
    for (const leaked of ['authorizedAt', '"published"', 'imageFile', 'imageMime', 'uploadedAt']) expect(text).not.toContain(leaked);
  });
});

describe('GET /api/gallery (public): when each photo went on air', () => {
  it('tells when each photo went on air, so the home can show the most recent ones', async () => {
    jest.spyOn(GalleryPhoto, 'findAll').mockResolvedValue([
      row({ id: 'p1', album: 'A', publishedAt: new Date('2026-10-01T12:00:00Z') }),
      row({ id: 'p2', album: 'A', publishedAt: new Date('2026-10-03T12:00:00Z') }),
      row({ id: 'p3', album: 'B', publishedAt: null, createdAt: new Date('2026-10-02T12:00:00Z') }),
    ]);

    const response = await request(app).get('/api/gallery');

    const dates = Object.fromEntries(response.body.data.flatMap((album: { photos: { id: string; publishedAt: string }[] }) => album.photos).map((photo: { id: string; publishedAt: string }) => [photo.id, photo.publishedAt]));
    expect(dates).toEqual({ p1: '2026-10-01T12:00:00.000Z', p2: '2026-10-03T12:00:00.000Z', p3: '2026-10-02T12:00:00.000Z' });
  });
});

describe('GET /api/gallery/:id/image (public)', () => {
  it('serves the stored bytes only for a published and authorized photo', async () => {
    const findOne = jest.spyOn(GalleryPhoto, 'findOne').mockResolvedValue(row({ imageFile: planted() }));

    const response = await request(app).get(`/api/gallery/${PHOTO_ID}/image`).buffer(true).parse(binary);

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['cache-control']).toBe('public, max-age=300');
    expect(Buffer.compare(response.body as Buffer, PNG)).toBe(0);
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: PHOTO_ID, published: true, authorizedAt: { [Op.ne]: null } });
  });

  it('answers 404 for anything the filter does not find, and 400 for a malformed id', async () => {
    jest.spyOn(GalleryPhoto, 'findOne').mockResolvedValue(null);

    const missing = await request(app).get(`/api/gallery/${PHOTO_ID}/image`);
    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('photo_not_found');
    expect((await request(app).get('/api/gallery/nao-e-um-id/image')).status).toBe(400);
  });

  it('answers 404 when the row is public but the file is gone, without leaking the path', async () => {
    jest.spyOn(GalleryPhoto, 'findOne').mockResolvedValue(row({ imageFile: `${randomUUID()}.png` }));

    const response = await request(app).get(`/api/gallery/${PHOTO_ID}/image`);

    expect(response.status).toBe(404);
    expect(response.headers['content-type']).toMatch(/json/);
    expect(JSON.stringify(response.body)).not.toContain(uploadsDir());
  });
});

describe('the staff guard on every admin gallery route', () => {
  const routes: [string, string][] = [
    ['get', '/api/admin/gallery'],
    ['post', '/api/admin/gallery'],
    ['get', `/api/admin/gallery/${PHOTO_ID}`],
    ['put', `/api/admin/gallery/${PHOTO_ID}`],
    ['patch', `/api/admin/gallery/${PHOTO_ID}/publication`],
    ['get', `/api/admin/gallery/${PHOTO_ID}/image`],
    ['delete', `/api/admin/gallery/${PHOTO_ID}`],
  ];
  const call = (method: string, url: string) => (request(app) as unknown as Record<string, (path: string) => request.Test>)[method]!(url);
  const spies = () => [
    jest.spyOn(GalleryPhoto, 'findAll'),
    jest.spyOn(GalleryPhoto, 'findByPk'),
    jest.spyOn(GalleryPhoto, 'findOne'),
    jest.spyOn(GalleryPhoto, 'create'),
    jest.spyOn(GalleryPhoto, 'update'),
    jest.spyOn(GalleryPhoto, 'destroy'),
  ];

  it.each(routes)('%s %s answers 401 without a session and touches nothing', async (method, url) => {
    const touched = spies();
    const before = filesInDir().length;
    const response = await call(method, url).send(upload(PNG));
    expect(response.status).toBe(401);
    for (const spy of touched) expect(spy).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it.each(routes)('%s %s answers 403 to someone who is not staff and touches nothing', async (method, url) => {
    asStaff(false);
    const touched = spies();
    const before = filesInDir().length;
    const response = await call(method, url).set(auth).send(upload(PNG));
    expect(response.status).toBe(403);
    for (const spy of touched) expect(spy).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });
});

describe('admin gallery: listing', () => {
  it('lists every photo with its state, never cached, and a staff-only image address', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'findAll').mockResolvedValue([
      row({ id: 'live' }),
      row({ id: 'kept', published: false }),
      row({ id: 'none', published: false, authorizedAt: null, publishedAt: null }),
    ]);

    const response = await request(app).get('/api/admin/gallery').set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('no-store');
    expect(response.body.data.map((photo: { state: string }) => photo.state)).toEqual(['live', 'stored', 'unauthorized']);
    expect(response.body.data[2]).toMatchObject({ authorized: false, published: false, publishedAt: null });
    expect(response.body.data[0].imageUrl).toBe(`/api/admin/gallery/live/image?v=${new Date('2026-10-12T12:00:00.123Z').getTime()}`);
    expect(JSON.stringify(response.body)).not.toContain('imageFile');
  });

  it('answers 404 for a photo that does not exist', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(null);
    const response = await request(app).get(`/api/admin/gallery/${PHOTO_ID}`).set(auth);
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('photo_not_found');
  });

  it('lets staff see the image of a photo that is not public, uncached', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'findOne').mockResolvedValue(row({ published: false, authorizedAt: null, imageFile: planted() }));

    const response = await request(app).get(`/api/admin/gallery/${PHOTO_ID}/image`).set(auth);

    expect(response.status).toBe(200);
    expect(response.headers['cache-control']).toBe('private, no-store');
  });
});

describe('admin gallery: uploading never publishes', () => {
  const post = (body: unknown) => request(app).post('/api/admin/gallery').set(auth).send(body as object);

  function setup() {
    asStaff();
    return jest.spyOn(GalleryPhoto, 'create').mockImplementation(async (values) => row({ publishedAt: null, ...(values as Record<string, unknown>) }));
  }

  it('stores the bytes on disk, keeps the declaration as a date and creates the photo unpublished', async () => {
    const create = setup();
    const before = filesInDir().length;

    const response = await post(upload(PNG, { caption: '  Lançamento.  ' }));

    expect(response.status).toBe(201);
    const values = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(values.imageFile).toMatch(STORED_NAME_PATTERN);
    expect(values).toMatchObject({ album: 'II Festa Preta', caption: 'Lançamento.', imageMime: 'image/png', published: false });
    expect(values.authorizedAt).toBeInstanceOf(Date);
    expect(filesInDir()).toHaveLength(before + 1);
    expect(response.body.photo).toMatchObject({ state: 'stored', published: false, publishedAt: null });
  });

  it('keeps the photo without the declaration, as unauthorized, and still unpublished', async () => {
    const create = setup();

    const response = await post(upload(PNG, { authorized: undefined }));

    expect(response.status).toBe(201);
    expect(create.mock.calls[0]![0]).toMatchObject({ authorizedAt: null, published: false });
    expect(response.body.photo).toMatchObject({ state: 'unauthorized', authorized: false });
  });

  it('ignores everything the form never sends: published, publishedAt, id, file columns', async () => {
    const create = setup();

    await post(upload(PNG, { published: true, publishedAt: '2020-01-01T00:00:00Z', id: randomUUID(), imageFile: 'x.png', authorizedAt: '2020-01-01', authorized: false }));

    const values = create.mock.calls[0]![0] as unknown as Record<string, unknown>;
    expect(values.published).toBe(false);
    expect(values.publishedAt).toBeUndefined();
    expect(values.id).toBeUndefined();
    expect(values.imageFile).toMatch(STORED_NAME_PATTERN);
    expect(values.authorizedAt).toBeNull();
  });

  it('turns a blank caption into null and collapses the spaces of the album name', async () => {
    const create = setup();

    await post(upload(PNG, { caption: '   ', album: '  II   Festa  Preta ' }));

    expect(create.mock.calls[0]![0]).toMatchObject({ caption: null, album: 'II Festa Preta' });
  });

  it.each([
    ['without an album', upload(PNG, { album: '   ' }), 'album'],
    ['with a very long album', upload(PNG, { album: 'a'.repeat(121) }), 'album'],
    ['without a description', upload(PNG, { alt: '   ' }), 'alt'],
    ['with a very long caption', upload(PNG, { caption: 'a'.repeat(301) }), 'caption'],
    ['with the declaration as text', upload(PNG, { authorized: 'true' }), 'authorized'],
    ['with data that is not base64', upload(PNG, { data: '***' }), 'data'],
    ['without a photo', { album: 'A', alt: 'B' }, 'data'],
  ])('refuses an upload %s and writes nothing', async (_label, body, field) => {
    const create = setup();
    const before = filesInDir().length;

    const response = await post(body);

    expect(response.status).toBe(400);
    expect(response.body.error.details.map((detail: { field: string }) => detail.field)).toContain(field);
    expect(create).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it('reads the bytes, not the name: text pretending to be a photo is refused', async () => {
    const create = setup();
    const response = await post(upload(FAKE_JPG));
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_image');
    expect(create).not.toHaveBeenCalled();
  });

  it('refuses more than 4 MB with 413 and writes nothing', async () => {
    const create = setup();
    const before = filesInDir().length;
    const response = await post(upload(Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024)])));
    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('image_too_large');
    expect(create).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it('accepts a photo close to the limit despite the base64 overhead', async () => {
    const create = setup();
    const response = await post(upload(Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024 - PNG.length)])));
    expect(response.status).toBe(201);
    expect(create).toHaveBeenCalled();
  });

  it('does not leave the file behind when the database refuses the row', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'create').mockRejectedValue(new Error('database down'));
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const before = filesInDir().length;

    const response = await post(upload(PNG));

    expect(response.status).toBe(500);
    expect(filesInDir()).toHaveLength(before);
  });
});

describe('admin gallery: publication is a separate act', () => {
  const publish = (published: unknown) => request(app).patch(`/api/admin/gallery/${PHOTO_ID}/publication`).set(auth).send({ published });

  it('stamps the date on the first publication', async () => {
    asStaff();
    const stored = row({ published: false, publishedAt: null });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(stored);

    const response = await publish(true);

    expect(response.status).toBe(200);
    const [values, options] = stored.update.mock.calls[0]!;
    expect(values.published).toBe(true);
    expect(values.publishedAt).toBeInstanceOf(Date);
    expect(options).toEqual({ fields: ['published', 'publishedAt'] });
    expect(response.body.photo.state).toBe('live');
  });

  it('keeps the original date when it is published again, and when it is taken down', async () => {
    asStaff();
    const taken = row({ published: false });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(taken);

    await publish(true);
    expect(taken.update.mock.calls[0]).toEqual([{ published: true }, { fields: ['published'] }]);

    const down = await publish(false);
    expect(taken.update.mock.calls[1]).toEqual([{ published: false }, { fields: ['published'] }]);
    expect(down.body.photo).toMatchObject({ state: 'stored', publishedAt: '2026-10-13T15:00:00.000Z' });
  });

  it('refuses to publish a photo without the declaration, with 409, and writes nothing', async () => {
    asStaff();
    const unauthorized = row({ published: false, authorizedAt: null, publishedAt: null });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(unauthorized);

    const response = await publish(true);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('authorization_missing');
    expect(unauthorized.update).not.toHaveBeenCalled();
  });

  it('answers 404 for a photo that does not exist and 400 for an unclear answer', async () => {
    asStaff();
    const findByPk = jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(null);
    expect((await publish(true)).status).toBe(404);
    findByPk.mockClear();
    for (const value of [undefined, 'true', 1]) expect((await publish(value)).status).toBe(400);
    expect(findByPk).not.toHaveBeenCalled();
  });
});

describe('admin gallery: deleting', () => {
  it('deletes the row and removes the file from disk', async () => {
    asStaff();
    const name = planted();
    const target = row({ imageFile: name });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(target);

    const response = await request(app).delete(`/api/admin/gallery/${PHOTO_ID}`).set(auth);

    expect(response.status).toBe(204);
    expect(target.destroy).toHaveBeenCalled();
    expect(fs.existsSync(path.join(uploadsDir(), name))).toBe(false);
  });

  it('keeps the file when the row could not be deleted', async () => {
    asStaff();
    const name = planted();
    const target = row({ imageFile: name });
    target.destroy.mockRejectedValue(new Error('database down'));
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(target);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);

    const response = await request(app).delete(`/api/admin/gallery/${PHOTO_ID}`).set(auth);

    expect(response.status).toBe(500);
    expect(fs.existsSync(path.join(uploadsDir(), name))).toBe(true);
  });

  it('answers 404 for a photo that does not exist', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(null);
    expect((await request(app).delete(`/api/admin/gallery/${PHOTO_ID}`).set(auth)).status).toBe(404);
  });
});

describe('admin gallery: editing the text', () => {
  const edit = (body: Record<string, unknown>) => request(app).put(`/api/admin/gallery/${PHOTO_ID}`).set(auth).send(body);
  const text = { album: 'II Festa Preta (2026)', alt: 'Duas pessoas tocam tambor.', caption: 'Roda de abertura.' };

  it('writes only album, alt and caption, and answers the photo as the list does', async () => {
    asStaff();
    const stored = row();
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(stored);

    const response = await edit(text);

    expect(response.status).toBe(200);
    expect(stored.update.mock.calls[0]).toEqual([text, { fields: ['album', 'alt', 'caption'] }]);
    expect(response.body.photo).toMatchObject({ id: PHOTO_ID, album: text.album, alt: text.alt, caption: text.caption, state: 'live' });
    expect(response.headers['cache-control']).toBe('no-store');
  });

  it('never touches the file, the declaration or the publication, whatever the body carries', async () => {
    asStaff();
    const stored = row({ published: false, authorizedAt: null, publishedAt: null });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(stored);
    const before = filesInDir().length;

    const response = await edit({ ...text, published: true, publishedAt: '2026-01-01T00:00:00Z', authorized: true, authorizedAt: '2026-01-01T00:00:00Z', imageFile: '../x.png', id: randomUUID(), data: PNG.toString('base64') });

    expect(response.status).toBe(200);
    expect(stored.update.mock.calls[0]).toEqual([text, { fields: ['album', 'alt', 'caption'] }]);
    expect(response.body.photo).toMatchObject({ state: 'unauthorized', published: false, authorized: false, publishedAt: null });
    expect(filesInDir()).toHaveLength(before);
  });

  it('turns a blank caption into null and collapses the spaces of the album name', async () => {
    asStaff();
    const stored = row({ caption: 'Antiga.' });
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(stored);

    const response = await edit({ album: '  II   Festa  Preta ', alt: ' Descrição. ', caption: '   ' });

    expect(response.status).toBe(200);
    expect(stored.update.mock.calls[0]![0]).toEqual({ album: 'II Festa Preta', alt: 'Descrição.', caption: null });
  });

  it.each([
    ['no album', { ...text, album: '  ' }, 'album'],
    ['no description', { ...text, alt: '' }, 'alt'],
    ['an album over the limit', { ...text, album: 'a'.repeat(121) }, 'album'],
    ['a description over the limit', { ...text, alt: 'a'.repeat(301) }, 'alt'],
    ['a caption over the limit', { ...text, caption: 'a'.repeat(301) }, 'caption'],
    ['a caption that is not text', { ...text, caption: 7 }, 'caption'],
  ])('answers 400 and writes nothing for %s', async (_name, body, field) => {
    asStaff();
    const findByPk = jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(row());

    const response = await edit(body);

    expect(response.status).toBe(400);
    expect(JSON.stringify(response.body.error.details)).toContain(field);
    expect(findByPk).not.toHaveBeenCalled();
  });

  it('answers 404 for a photo that does not exist and writes nothing', async () => {
    asStaff();
    jest.spyOn(GalleryPhoto, 'findByPk').mockResolvedValue(null);
    const update = jest.spyOn(GalleryPhoto, 'update');

    expect((await edit(text)).status).toBe(404);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('what the gallery does not have', () => {
  it('has no way to set published through anything but its own route', async () => {
    asStaff();
    expect((await request(app).patch(`/api/admin/gallery/${PHOTO_ID}`).set(auth).send({ published: true })).status).toBe(404);
  });
});
