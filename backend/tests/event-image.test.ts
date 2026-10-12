import fs from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import express from 'express';
import request from 'supertest';
import { createApp } from '../src/app';
import { Event, Registration, User } from '../src/models';
import { signToken } from '../src/utils/token';
import { STORED_NAME_PATTERN, uploadsDir } from '../src/utils/event-image-storage';

const app = createApp();

const STAFF_ID = '11111111-1111-4111-8111-111111111111';
const EVENT_ID = '22222222-2222-4222-8222-222222222222';
const auth = { Authorization: `Bearer ${signToken({ sub: STAFF_ID })}` };

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.from('resto do arquivo')]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), Buffer.from('resto do arquivo')]);
const GIF87 = Buffer.concat([Buffer.from('GIF87a'), Buffer.from('resto do arquivo')]);
const GIF89 = Buffer.concat([Buffer.from('GIF89a'), Buffer.from('resto do arquivo')]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBPVP8 resto')]);
const FAKE_JPG = Buffer.from('isto é só texto, com nome de foto.jpg');

const body = (data: Buffer, extra: Record<string, unknown> = {}) => ({
  data: data.toString('base64'),
  alt: 'Homem sorridente deitado entre vários exemplares de um livro ilustrado.',
  authorized: true,
  ...extra,
});

function storedEvent(overrides: Record<string, unknown> = {}) {
  return {
    id: EVENT_ID,
    title: 'Contação',
    description: null,
    category: null,
    startsAt: new Date('2026-11-20T18:00:00Z'),
    endsAt: null,
    location: null,
    ageRange: null,
    capacity: null,
    requiresCpf: false,
    registrationOnSite: true,
    published: true,
    updatedAt: new Date('2026-10-09T12:00:00Z'),
    imageFile: null,
    imageMime: null,
    imageAlt: null,
    imageAuthorizedAt: null,
    imageUpdatedAt: null,
    ...overrides,
  } as unknown as Event;
}

const filesInDir = () => (fs.existsSync(uploadsDir()) ? fs.readdirSync(uploadsDir()) : []);

function plant(bytes: Buffer = PNG, extension = 'png') {
  fs.mkdirSync(uploadsDir(), { recursive: true });
  const name = `${randomUUID()}.${extension}`;
  fs.writeFileSync(path.join(uploadsDir(), name), bytes);
  return name;
}

function withPhoto(overrides: Record<string, unknown> = {}) {
  return storedEvent({ imageFile: 'planted' in overrides ? overrides.planted : plant(), imageMime: 'image/png', imageAlt: 'Uma foto', imageUpdatedAt: new Date('2026-10-12T12:00:00.123Z'), ...overrides });
}

function asStaff(isStaff = true) {
  jest.spyOn(User, 'findByPk').mockResolvedValue({ id: STAFF_ID, isStaff } as unknown as User);
}

function setupUpload() {
  asStaff();
    const update = jest.spyOn(Event, 'update').mockResolvedValue([1]);
  jest.spyOn(Event, 'findByPk').mockResolvedValue(withPhoto());
  return update;
}

beforeEach(() => {
  jest.spyOn(Registration, 'findAll').mockResolvedValue([]);
});

afterEach(() => jest.restoreAllMocks());

afterAll(() => fs.rmSync(uploadsDir(), { recursive: true, force: true }));

describe('GET /api/events/:id/image (public)', () => {
  it('serves the stored bytes with the stored type, nosniff, inline and an hour of cache', async () => {
    const findOne = jest.spyOn(Event, 'findOne').mockResolvedValue(withPhoto());

    const response = await request(app).get(`/api/events/${EVENT_ID}/image`).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['content-disposition']).toBe('inline');
    expect(response.headers['cache-control']).toBe('public, max-age=3600');
    expect(Buffer.compare(response.body as Buffer, PNG)).toBe(0);
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ id: EVENT_ID, published: true });
  });

  it('answers 304 when the validator still matches, and a new one after the photo changes', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(withPhoto());
    const first = await request(app).get(`/api/events/${EVENT_ID}/image`);
    const etag = first.headers.etag as string;
    expect(etag).toBeTruthy();

    const cached = await request(app).get(`/api/events/${EVENT_ID}/image`).set('If-None-Match', etag);
    expect(cached.status).toBe(304);

    jest.restoreAllMocks();
    jest.spyOn(Event, 'findOne').mockResolvedValue(withPhoto({ imageUpdatedAt: new Date('2026-10-12T12:00:00.456Z') }));
    const changed = await request(app).get(`/api/events/${EVENT_ID}/image`).set('If-None-Match', etag);
    expect(changed.status).toBe(200);
    expect(changed.headers.etag).not.toBe(etag);
  });

  it('answers 404 in the usual error format for a draft, a missing event and an event without photo', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValueOnce(null).mockResolvedValueOnce(storedEvent());

    const missing = await request(app).get(`/api/events/${EVENT_ID}/image`);
    const noPhoto = await request(app).get(`/api/events/${EVENT_ID}/image`);

    expect(missing.status).toBe(404);
    expect(missing.body.error.code).toBe('image_not_found');
    expect(noPhoto.status).toBe(404);
    expect(noPhoto.body).toEqual(missing.body);
  });

  it('only ever asks for published events', async () => {
    const findOne = jest.spyOn(Event, 'findOne').mockResolvedValue(null);

    await request(app).get(`/api/events/${EVENT_ID}/image`);

    expect(findOne.mock.calls[0]![0]!.where).toMatchObject({ published: true });
  });

  it('answers 400 for an id that is not a uuid, without touching the database', async () => {
    const findOne = jest.spyOn(Event, 'findOne');

    expect((await request(app).get('/api/events/abc/image')).status).toBe(400);
    expect(findOne).not.toHaveBeenCalled();
  });
});

describe('the photo is announced in the event, never embedded', () => {
  it('lists the photo as { url, alt } with a cache-busting version, and no bytes', async () => {
    jest.spyOn(Event, 'findAll').mockResolvedValue([withPhoto({ registrationOnSite: true })]);

    const response = await request(app).get('/api/events');

    expect(response.body.data[0].image).toEqual({ url: `/api/events/${EVENT_ID}/image?v=${new Date('2026-10-12T12:00:00.123Z').getTime()}`, alt: 'Uma foto' });
    expect(JSON.stringify(response.body)).not.toContain('imageData');
    expect(JSON.stringify(response.body)).not.toContain('iVBOR');
  });

  it('has no image when there is no photo', async () => {
    jest.spyOn(Event, 'findAll').mockResolvedValue([storedEvent()]);

    expect((await request(app).get('/api/events')).body.data[0].image).toBeNull();
  });

  it('never exposes the stored file name, only the url and the description', async () => {
    const event = withPhoto();
    jest.spyOn(Event, 'findAll').mockResolvedValue([event]);

    const response = await request(app).get('/api/events');

    expect(JSON.stringify(response.body)).not.toContain(event.imageFile as string);
    expect(Object.keys(response.body.data[0].image).sort()).toEqual(['alt', 'url']);
    expect(Object.keys(Event.getAttributes())).not.toContain('imageData');
  });
});

describe('PUT /api/admin/events/:id/image (RN07)', () => {
  const put = (payload: unknown, headers: Record<string, string> = auth) => request(app).put(`/api/admin/events/${EVENT_ID}/image`).set(headers).send(payload as object);

  it('answers 401 without a token and 403 to whoever is not staff, before touching the event', async () => {
    const update = jest.spyOn(Event, 'update');

    expect((await put(body(PNG), {})).status).toBe(401);

    asStaff(false);
    const forbidden = await put(body(PNG));

    expect(forbidden.status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['GIF87a', GIF87, 'image/gif'],
    ['GIF89a', GIF89, 'image/gif'],
    ['WebP', WEBP, 'image/webp'],
  ])('accepts a real %s and stores the type read from the bytes', async (_label, bytes, mime) => {
    const update = setupUpload();

    const response = await put(body(bytes));

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]![0]).toMatchObject({ imageMime: mime });
    expect(response.body.event.image.alt).toBe('Uma foto');
  });

  it('refuses a text file with a photo name, and says so on the data field', async () => {
    const update = setupUpload();

    const response = await put(body(FAKE_JPG, { name: 'foto.jpg', mime: 'image/jpeg', type: 'image/jpeg' }));

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_image');
    expect(response.body.error.details[0].field).toBe('data');
    expect(update).not.toHaveBeenCalled();
  });

  it('refuses a PNG label on top of JPEG bytes by trusting only the bytes: the stored type is JPEG', async () => {
    const update = setupUpload();

    await put(body(JPEG, { mime: 'image/png' }));

    expect(update.mock.calls[0]![0]).toMatchObject({ imageMime: 'image/jpeg' });
  });

  it('refuses a RIFF file that is not WebP', async () => {
    const update = setupUpload();
    const wav = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WAVEfmt ')]);

    expect((await put(body(wav))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('takes exactly 4 MB and refuses one byte more with 413', async () => {
    const update = setupUpload();
    const limit = 4 * 1024 * 1024;
    const exactly = Buffer.concat([PNG, Buffer.alloc(limit - PNG.length)]);
    const over = Buffer.concat([PNG, Buffer.alloc(limit - PNG.length + 1)]);

    expect((await put(body(exactly))).status).toBe(200);
    update.mockClear();
    const refused = await put(body(over));

    expect(refused.status).toBe(413);
    expect(refused.body.error.code).toBe('image_too_large');
    expect(update).not.toHaveBeenCalled();
  });

  it('answers 413 in the error format when the whole request passes the 6 MB parser limit', async () => {
    setupUpload();

    const response = await put(body(Buffer.concat([PNG, Buffer.alloc(7 * 1024 * 1024)])));

    expect(response.status).toBe(413);
    expect(response.body.error.code).toBe('payload_too_large');
  });

  it('keeps the small body limit on every other route', async () => {
    asStaff();

    const response = await request(app)
      .post('/api/admin/events')
      .set(auth)
      .send({ title: 'x', startsAt: '2026-11-20T15:00', description: 'a'.repeat(200 * 1024) });

    expect(response.status).toBe(413);
  });

  it.each([
    ['without the declaration', { authorized: undefined }],
    ['with the declaration false', { authorized: false }],
    ['with the declaration as text', { authorized: 'true' }],
  ])('does not store the photo %s (RN07)', async (_label, patch) => {
    const update = setupUpload();

    const response = await put(body(PNG, patch));

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('authorized');
    expect(update).not.toHaveBeenCalled();
  });

  it.each([
    ['missing', { alt: undefined }],
    ['blank', { alt: '   ' }],
    ['over 300 characters', { alt: 'a'.repeat(301) }],
  ])('refuses a description that is %s', async (_label, patch) => {
    const update = setupUpload();

    const response = await put(body(PNG, patch));

    expect(response.status).toBe(400);
    expect(response.body.error.details[0].field).toBe('alt');
    expect(update).not.toHaveBeenCalled();
  });

  it.each(['', 'isto não é base64!', 'abc'])('refuses data that is not base64: %j', async (data) => {
    const update = setupUpload();

    const response = await put({ ...body(PNG), data });

    expect(response.status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });

  it('records the declaration as a date and writes only the five image columns, ignoring a hostile body', async () => {
    const update = setupUpload();

    await put(
      body(PNG, { published: true, id: 'outro', title: 'trocado', imageAuthorizedAt: '2000-01-01', imageMime: 'text/html', imageUpdatedAt: '2000-01-01', requiresCpf: true }),
    );

    const [values, options] = update.mock.calls[0]!;
    expect(Object.keys(values).sort()).toEqual(['imageAlt', 'imageAuthorizedAt', 'imageFile', 'imageMime', 'imageUpdatedAt']);
    expect(values.imageAuthorizedAt).toBeInstanceOf(Date);
    expect((values.imageAuthorizedAt as Date).getFullYear()).toBeGreaterThan(2020);
    expect(values.imageMime).toBe('image/png');
    expect(options).toMatchObject({ where: { id: EVENT_ID }, fields: ['imageFile', 'imageMime', 'imageAlt', 'imageAuthorizedAt', 'imageUpdatedAt'] });
  });

  it('answers 404 for an event that does not exist, and 400 for an id that is not a uuid', async () => {
    asStaff();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);
    const update = jest.spyOn(Event, 'update');

    expect((await put(body(PNG))).status).toBe(404);
    expect((await request(app).put('/api/admin/events/abc/image').set(auth).send(body(PNG))).status).toBe(400);
    expect(update).not.toHaveBeenCalled();
  });
});

describe('DELETE /api/admin/events/:id/image', () => {
  const del = (headers: Record<string, string> = auth) => request(app).delete(`/api/admin/events/${EVENT_ID}/image`).set(headers);

  it('answers 401 and 403 like the rest of the panel', async () => {
    const update = jest.spyOn(Event, 'update');

    expect((await del({})).status).toBe(401);
    asStaff(false);
    expect((await del()).status).toBe(403);
    expect(update).not.toHaveBeenCalled();
  });

  it('clears the five columns together', async () => {
    const update = setupUpload();

    const response = await del();

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]![0]).toEqual({ imageFile: null, imageMime: null, imageAlt: null, imageAuthorizedAt: null, imageUpdatedAt: null });
  });

  it('answers 404 for an event that does not exist', async () => {
    asStaff();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(null);

    expect((await del()).status).toBe(404);
  });
});

describe('the photo as a file on disk', () => {
  const put = (payload: unknown) => request(app).put(`/api/admin/events/${EVENT_ID}/image`).set(auth).send(payload as object);

  function setup(current: string | null = null) {
    asStaff();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(storedEvent({ imageFile: current }));
    return jest.spyOn(Event, 'update').mockResolvedValue([1]);
  }

  beforeEach(() => fs.rmSync(uploadsDir(), { recursive: true, force: true }));

  it.each([
    ['JPEG', JPEG, 'jpg'],
    ['PNG', PNG, 'png'],
    ['GIF', GIF89, 'gif'],
    ['WebP', WEBP, 'webp'],
  ])('writes a %s under a generated name whose extension comes from the bytes', async (_label, bytes, extension) => {
    const update = setup();

    await put(body(bytes, { name: 'minha-foto.exe', filename: 'x.php' }));

    const files = filesInDir();
    expect(files).toHaveLength(1);
    expect(files[0]).toMatch(STORED_NAME_PATTERN);
    expect(files[0]!.endsWith(`.${extension}`)).toBe(true);
    expect(Buffer.compare(fs.readFileSync(path.join(uploadsDir(), files[0]!)), bytes)).toBe(0);
    expect(update.mock.calls[0]![0]).toMatchObject({ imageFile: files[0] });
  });

  it('leaves no temporary file behind', async () => {
    setup();

    await put(body(PNG));

    expect(filesInDir().filter((file) => file.endsWith('.tmp'))).toEqual([]);
  });

  it.each(['../../evil.png', '/etc/passwd', '..\\..\\x.jpg', 'a/b.png'])('never uses a name sent by the client: %s', async (hostile) => {
    const update = setup();

    await put(body(PNG, { name: hostile, file: hostile, filename: hostile, imageFile: hostile, alt: hostile, path: hostile }));

    expect(filesInDir()).toHaveLength(1);
    expect(filesInDir()[0]).toMatch(STORED_NAME_PATTERN);
    expect(fs.existsSync(path.join(uploadsDir(), '..', 'evil.png'))).toBe(false);
    expect(update.mock.calls[0]![0]).toMatchObject({ imageFile: filesInDir()[0] });
  });

  it('replacing the photo writes the new file, updates the row and then deletes the old file', async () => {
    const old = plant(PNG, 'png');
    const update = setup(old);

    await put(body(JPEG));

    expect(fs.existsSync(path.join(uploadsDir(), old))).toBe(false);
    expect(filesInDir()).toHaveLength(1);
    expect(filesInDir()[0]!.endsWith('.jpg')).toBe(true);
    expect(update).toHaveBeenCalledTimes(1);
  });

  it('a failed UPDATE keeps the old photo and leaves no orphan', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const old = plant(PNG, 'png');
    const update = setup(old);
    update.mockRejectedValue(new Error('banco caiu'));

    const response = await put(body(JPEG));

    expect(response.status).toBe(500);
    expect(filesInDir()).toEqual([old]);
  });

  it('a failed write answers an error, keeps the old photo and leaves no temporary file', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const old = plant(PNG, 'png');
    const update = setup(old);
    jest.spyOn(fs.promises, 'rename').mockRejectedValue(new Error('disco cheio'));

    const response = await put(body(JPEG));

    expect(response.status).toBe(500);
    expect(update).not.toHaveBeenCalled();
    expect(filesInDir()).toEqual([old]);
  });

  it('removing zeroes the row and deletes the file', async () => {
    const old = plant();
    const update = setup(old);

    const response = await request(app).delete(`/api/admin/events/${EVENT_ID}/image`).set(auth);

    expect(response.status).toBe(200);
    expect(update.mock.calls[0]![0]).toEqual({ imageFile: null, imageMime: null, imageAlt: null, imageAuthorizedAt: null, imageUpdatedAt: null });
    expect(filesInDir()).toEqual([]);
  });

  it('removing answers 200 even when the file cannot be deleted, and the row is already zeroed first', async () => {
    const error = jest.spyOn(console, 'error').mockImplementation(() => undefined);
    const old = plant();
    const update = setup(old);
    jest.spyOn(fs.promises, 'rm').mockRejectedValue(new Error('sem permissão'));

    const response = await request(app).delete(`/api/admin/events/${EVENT_ID}/image`).set(auth);

    expect(response.status).toBe(200);
    expect(update).toHaveBeenCalledTimes(1);
    expect(error).toHaveBeenCalled();
  });

  it('serves the file by stream from the fixed folder, with the same bytes and 304 by version', async () => {
    const name = plant(JPEG, 'jpg');
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ imageFile: name, imageMime: 'image/jpeg', imageUpdatedAt: new Date('2026-10-12T12:00:00.123Z') }));

    const first = await request(app).get(`/api/events/${EVENT_ID}/image`).buffer(true).parse((res, done) => {
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => done(null, Buffer.concat(chunks)));
    });
    const cached = await request(app).get(`/api/events/${EVENT_ID}/image`).set('If-None-Match', first.headers.etag as string);

    expect(first.status).toBe(200);
    expect(first.headers['content-type']).toBe('image/jpeg');
    expect(first.headers['cross-origin-resource-policy']).toBe('cross-origin');
    expect(first.headers['cache-control']).toBe('public, max-age=3600');
    expect(Buffer.compare(first.body as Buffer, JPEG)).toBe(0);
    expect(cached.status).toBe(304);
  });

  it.each(['../../etc/passwd', '../x.png', 'planted.png', `${randomUUID()}.svg`, `${randomUUID()}.png/../x`, '', `${randomUUID()}.PNG`])(
    'a row pointing to %j answers 404 without touching the disk',
    async (name) => {
      const send = jest.spyOn(express.response, 'sendFile');
      jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ imageFile: name, imageMime: 'image/png', imageUpdatedAt: new Date() }));

      const response = await request(app).get(`/api/events/${EVENT_ID}/image`);

      expect(response.status).toBe(404);
      expect(send).not.toHaveBeenCalled();
    },
  );

  it('a valid name whose file is gone answers 404 in the usual format', async () => {
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ imageFile: `${randomUUID()}.png`, imageMime: 'image/png', imageUpdatedAt: new Date() }));

    const response = await request(app).get(`/api/events/${EVENT_ID}/image`);

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('image_not_found');
  });

  it('the staff route applies the same name rule', async () => {
    asStaff();
    const send = jest.spyOn(express.response, 'sendFile');
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent({ imageFile: '../../etc/passwd', imageMime: 'image/png', imageUpdatedAt: new Date() }));

    const response = await request(app).get(`/api/admin/events/${EVENT_ID}/image`).set(auth);

    expect(response.status).toBe(404);
    expect(send).not.toHaveBeenCalled();
  });
});

describe('GET /api/admin/events/:id/image', () => {
  const get = (headers: Record<string, string> = auth) => request(app).get(`/api/admin/events/${EVENT_ID}/image`).set(headers);

  it('lets the staff see the photo of a draft, never cached', async () => {
    asStaff();
    jest.spyOn(Event, 'findOne').mockResolvedValue(withPhoto({ published: false }));

    const response = await get();

    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toBe('image/png');
    expect(response.headers['cache-control']).toBe('private, no-store');
  });

  it('answers 401 without a token and 403 to whoever is not staff', async () => {
    const findOne = jest.spyOn(Event, 'findOne');

    expect((await get({})).status).toBe(401);
    asStaff(false);
    expect((await get()).status).toBe(403);
    expect(findOne).not.toHaveBeenCalled();
  });

  it('answers 404 when the event has no photo', async () => {
    asStaff();
    jest.spyOn(Event, 'findOne').mockResolvedValue(storedEvent());

    expect((await get()).status).toBe(404);
  });

  it('points the admin event image to the staff route, so a draft shows its photo', async () => {
    asStaff();
    jest.spyOn(Event, 'findByPk').mockResolvedValue(withPhoto({ published: false }));

    const response = await request(app).get(`/api/admin/events/${EVENT_ID}`).set(auth);

    expect(response.body.event.image.url).toMatch(new RegExp(`^/api/admin/events/${EVENT_ID}/image\\?v=\\d+$`));
  });
});
