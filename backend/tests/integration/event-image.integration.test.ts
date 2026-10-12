import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { Event, RefreshToken, Registration, sequelize, User } from '../../src/models';

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

const EVENT = { title: 'Cafú e o Café', startsAt: '2030-11-20T15:00', location: 'Sede do Ateliê', capacity: 12 };

const ALL_BYTES = Buffer.from(Array.from({ length: 256 }, (_, i) => i));
const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ALL_BYTES, Buffer.from([0, 0, 0xff, 0xfe])]);
const JPEG = Buffer.concat([Buffer.from([0xff, 0xd8, 0xff, 0xe0]), ALL_BYTES]);
const GIF = Buffer.concat([Buffer.from('GIF89a'), ALL_BYTES]);
const WEBP = Buffer.concat([Buffer.from('RIFF'), Buffer.from([0x10, 0, 0, 0]), Buffer.from('WEBP'), ALL_BYTES]);

const upload = (data: Buffer, extra: Record<string, unknown> = {}) => ({
  data: data.toString('base64'),
  alt: 'Homem sorridente deitado entre vários exemplares de um livro ilustrado.',
  authorized: true,
  ...extra,
});

async function staff() {
  const response = await request(app).post('/api/auth/register').send(ACCOUNT);
  await User.update({ isStaff: true }, { where: { id: response.body.user.id } });
  return { Authorization: `Bearer ${response.body.token as string}` };
}

async function createEvent(headers: Record<string, string>, extra: Record<string, unknown> = {}, publish = true) {
  const created = await request(app).post('/api/admin/events').set(headers).send({ ...EVENT, ...extra });
  const id = created.body.event.id as string;
  if (publish) await request(app).patch(`/api/admin/events/${id}/publication`).set(headers).send({ published: true });
  return id;
}

const binary = (res: request.Response, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

const getBytes = (path: string, headers: Record<string, string> = {}) => request(app).get(path).set(headers).buffer(true).parse(binary);

async function recordingSql<T>(run: () => Promise<T>): Promise<{ result: T; statements: string[] }> {
  const statements: string[] = [];
  const options = (sequelize as unknown as { options: { logging: unknown } }).options;
  const previous = options.logging;
  options.logging = (sql: string) => statements.push(sql);
  try {
    return { result: await run(), statements };
  } finally {
    options.logging = previous;
  }
}

async function insertRaw(columns: Record<string, unknown>) {
  const values = { id: randomUUID(), title: 'cru', starts_at: '2030-01-01 10:00:00', created_at: new Date(), updated_at: new Date(), ...columns };
  const names = Object.keys(values);
  await sequelize.query(`INSERT INTO events (${names.join(', ')}) VALUES (${names.map(() => '?').join(', ')})`, { replacements: Object.values(values) as never });
}

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await Registration.destroy({ where: {} });
  await Event.destroy({ where: {} });
  await RefreshToken.destroy({ where: {} });
  await User.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
});

describe('the photo round trip against a real MySQL', () => {
  it.each([
    ['JPEG', JPEG, 'image/jpeg'],
    ['PNG', PNG, 'image/png'],
    ['GIF', GIF, 'image/gif'],
    ['WebP', WEBP, 'image/webp'],
  ])('stores a %s and serves back the same bytes, every byte value included', async (_label, bytes, mime) => {
    const headers = await staff();
    const id = await createEvent(headers);

    const saved = await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(bytes));
    const served = await getBytes(`/api/events/${id}/image`);

    expect(saved.status).toBe(200);
    expect(served.status).toBe(200);
    expect(served.headers['content-type']).toBe(mime);
    expect(Buffer.compare(served.body as Buffer, bytes)).toBe(0);
  });

  it('takes a photo of exactly 4 MB, which fits a MEDIUMBLOB and the packet limit', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    const big = Buffer.concat([PNG, Buffer.alloc(4 * 1024 * 1024 - PNG.length, 7)]);

    expect((await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(big))).status).toBe(200);
    const served = await getBytes(`/api/events/${id}/image`);

    expect((served.body as Buffer).length).toBe(4 * 1024 * 1024);
  });

  it('answers 404 for a draft and for an event without photo, but the staff still sees the draft photo', async () => {
    const headers = await staff();
    const draft = await createEvent(headers, {}, false);
    const published = await createEvent(headers);
    await request(app).put(`/api/admin/events/${draft}/image`).set(headers).send(upload(PNG));

    expect((await request(app).get(`/api/events/${draft}/image`)).status).toBe(404);
    expect((await request(app).get(`/api/events/${published}/image`)).status).toBe(404);
    expect((await request(app).get(`/api/events/${randomUUID()}/image`)).status).toBe(404);
    expect((await getBytes(`/api/admin/events/${draft}/image`, headers)).status).toBe(200);
    expect((await request(app).get(`/api/admin/events/${draft}/image`)).status).toBe(401);
  });

  it('puts the photo in the event as { url, alt }, and the url changes when the photo changes', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));
    const first = (await request(app).get(`/api/events/${id}`)).body.event.image;

    await new Promise((resolve) => setTimeout(resolve, 5));
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(JPEG, { alt: 'Outra foto.' }));
    const second = (await request(app).get(`/api/events/${id}`)).body.event.image;

    expect(first.url).toMatch(new RegExp(`^/api/events/${id}/image\\?v=\\d+$`));
    expect(second.url).not.toBe(first.url);
    expect(second.alt).toBe('Outra foto.');
    const listed = (await request(app).get('/api/events')).body.data[0].image;
    expect(listed).toEqual(second);
  });

  it('answers 304 to a matching validator and 200 once the photo is replaced', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));
    const etag = (await request(app).get(`/api/events/${id}/image`)).headers.etag as string;

    expect((await request(app).get(`/api/events/${id}/image`).set('If-None-Match', etag)).status).toBe(304);

    await new Promise((resolve) => setTimeout(resolve, 5));
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(JPEG));
    expect((await request(app).get(`/api/events/${id}/image`).set('If-None-Match', etag)).status).toBe(200);
  });

  it('records the declaration as a date, and a new photo records it again', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));
    const [row] = (await sequelize.query('SELECT image_authorized_at, image_updated_at FROM events WHERE id = ?', { replacements: [id], type: 'SELECT' })) as {
      image_authorized_at: Date;
      image_updated_at: Date;
    }[];

    expect(row!.image_authorized_at).toBeInstanceOf(Date);
    expect(Math.abs(row!.image_authorized_at.getTime() - Date.now())).toBeLessThan(60_000);
  });

  it('removes the photo: the five columns go back to NULL and the public route answers 404', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));

    const removed = await request(app).delete(`/api/admin/events/${id}/image`).set(headers);
    const [row] = (await sequelize.query('SELECT image_data, image_mime, image_alt, image_authorized_at, image_updated_at FROM events WHERE id = ?', {
      replacements: [id],
      type: 'SELECT',
    })) as Record<string, unknown>[];

    expect(removed.status).toBe(200);
    expect(removed.body.event.image).toBeNull();
    expect(Object.values(row!)).toEqual([null, null, null, null, null]);
    expect((await request(app).get(`/api/events/${id}/image`)).status).toBe(404);
  });

  it('refuses what the rules refuse, and leaves the previous photo alone', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));

    const fake = await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(Buffer.from('só texto'), { name: 'foto.jpg' }));
    const withoutDeclaration = await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(JPEG, { authorized: false }));
    const withoutAlt = await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(JPEG, { alt: ' ' }));
    const tooBig = await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(Buffer.concat([JPEG, Buffer.alloc(4 * 1024 * 1024)])));

    expect([fake.status, withoutDeclaration.status, withoutAlt.status, tooBig.status]).toEqual([400, 400, 400, 413]);
    const served = await getBytes(`/api/events/${id}/image`);
    expect(Buffer.compare(served.body as Buffer, PNG)).toBe(0);
  });

  it('is not reachable by someone who is not staff', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    const other = await request(app).post('/api/auth/register').send({ ...ACCOUNT, email: 'outra@exemplo.com' });
    const common = { Authorization: `Bearer ${other.body.token as string}` };

    expect((await request(app).put(`/api/admin/events/${id}/image`).set(common).send(upload(PNG))).status).toBe(403);
    expect((await request(app).delete(`/api/admin/events/${id}/image`).set(common)).status).toBe(403);
    expect((await request(app).put(`/api/admin/events/${id}/image`).send(upload(PNG))).status).toBe(401);
    expect((await request(app).get(`/api/events/${id}/image`)).status).toBe(404);
  });

  it('keeps the photo when the event form is saved, even with a hostile body', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));

    await request(app)
      .put(`/api/admin/events/${id}`)
      .set(headers)
      .send({ ...EVENT, title: 'Novo título', imageData: 'AAAA', imageMime: 'text/html', imageAlt: 'trocada', imageUpdatedAt: '2000-01-01' });

    const served = await getBytes(`/api/events/${id}/image`);
    expect(Buffer.compare(served.body as Buffer, PNG)).toBe(0);
    expect(served.headers['content-type']).toBe('image/png');
    expect((await request(app).get(`/api/events/${id}`)).body.event.image.alt).toMatch(/^Homem sorridente/);
  });
});

describe('the CHECK that makes the photo all or nothing', () => {
  const photo = { image_data: PNG, image_mime: 'image/png', image_alt: 'Descrição', image_authorized_at: new Date(), image_updated_at: new Date() };

  it('takes an event without photo and an event with the whole photo', async () => {
    await insertRaw({});
    await insertRaw(photo);
  });

  it.each([
    ['without a description', { image_alt: null }],
    ['with a blank description', { image_alt: '   ' }],
    ['without the declaration', { image_authorized_at: null }],
    ['without the version date', { image_updated_at: null }],
    ['without a type', { image_mime: null }],
    ['with a type outside the four', { image_mime: 'image/svg+xml' }],
  ])('refuses bytes %s, by direct insert', async (_label, patch) => {
    await expect(insertRaw({ ...photo, ...patch })).rejects.toThrow(/events_image_all_or_nothing/);
  });

  it('refuses photo columns left over when the bytes are not there', async () => {
    await expect(insertRaw({ image_alt: 'sobrou' })).rejects.toThrow(/events_image_all_or_nothing/);
  });
});

describe('the bytes never ride along with lists, calendar, report or the panel', () => {
  it('does not select image_data anywhere but the two image routes', async () => {
    const headers = await staff();
    const id = await createEvent(headers, { startsAt: '2030-11-20T15:00' });
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));
    await Registration.create({ eventId: id, name: 'Ana', email: 'a@x.com', consentedAt: new Date() } as never);

    const { statements } = await recordingSql(async () => {
      await request(app).get('/api/events?period=upcoming');
      await request(app).get('/api/events?period=past');
      await request(app).get(`/api/events/${id}`);
      await request(app).get(`/api/events/${id}/calendar.ics`);
      await request(app).get('/api/admin/events').set(headers);
      await request(app).get(`/api/admin/events/${id}`).set(headers);
      await request(app).get(`/api/admin/events/${id}/registrations`).set(headers);
      await request(app).get(`/api/admin/events/${id}/attendance`).set(headers);
      await request(app).get('/api/admin/report').set(headers);
      await request(app).put(`/api/admin/events/${id}`).set(headers).send(EVENT);
      await request(app).patch(`/api/admin/events/${id}/publication`).set(headers).send({ published: true });
    });

    expect(statements.length).toBeGreaterThan(5);
    expect(statements.filter((sql) => /image_data/i.test(sql))).toEqual([]);
  });

  it('selects it in the two image routes, and in nothing else', async () => {
    const headers = await staff();
    const id = await createEvent(headers);
    await request(app).put(`/api/admin/events/${id}/image`).set(headers).send(upload(PNG));

    const { statements } = await recordingSql(async () => {
      await request(app).get(`/api/events/${id}/image`);
      await request(app).get(`/api/admin/events/${id}/image`).set(headers);
    });

    expect(statements.filter((sql) => /SELECT[^;]*image_data/i.test(sql))).toHaveLength(2);
  });
});

describe('sign-ups close where the database and the service lock', () => {
  const person = { name: 'Ana', email: 'ana@exemplo.com', consent: true };

  it('refuses with 409 once the event has started, even though it has not ended', async () => {
    const id = randomUUID();
    await insertRaw({ id, published: true, starts_at: new Date(Date.now() - 3600_000), ends_at: new Date(Date.now() + 3600_000) });

    const response = await request(app).post(`/api/events/${id}/registrations`).send(person);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('registrations_closed');
    expect(await Registration.count()).toBe(0);
  });

  it('still takes a sign-up for an event that starts in the future', async () => {
    const id = randomUUID();
    await insertRaw({ id, published: true, starts_at: new Date(Date.now() + 3600_000) });

    expect((await request(app).post(`/api/events/${id}/registrations`).send(person)).status).toBe(201);
  });

  it('refuses with 409 when the event does not take sign-ups on the site', async () => {
    const id = randomUUID();
    await insertRaw({ id, published: true, registration_on_site: false, starts_at: new Date(Date.now() + 3600_000) });

    const response = await request(app).post(`/api/events/${id}/registrations`).send(person);

    expect(response.status).toBe(409);
    expect(response.body.error.code).toBe('registrations_not_offered');
    expect(await Registration.count()).toBe(0);
  });

  it('defaults to sign-up on the site for rows that existed before the column', async () => {
    const id = randomUUID();
    await insertRaw({ id, published: true });

    expect((await request(app).get(`/api/events/${id}`)).body.event.registrationOnSite).toBe(true);
  });

  it('stores capacity NULL and no CPF when the staff chooses "sem inscrição pelo site"', async () => {
    const headers = await staff();
    const id = await createEvent(headers, { registrationOnSite: false, capacity: 20, requiresCpf: true });
    const [row] = (await sequelize.query('SELECT registration_on_site, capacity, requires_cpf FROM events WHERE id = ?', { replacements: [id], type: 'SELECT' })) as Record<string, unknown>[];

    expect(row).toEqual({ registration_on_site: 0, capacity: null, requires_cpf: 0 });
  });

  it('shows the five statuses of design 13c through the public detail', async () => {
    const headers = await staff();
    const soon = '2030-11-20T15:00';
    const open = await createEvent(headers, { startsAt: soon, capacity: 12 });
    const few = await createEvent(headers, { startsAt: soon, capacity: 1 });
    const full = await createEvent(headers, { startsAt: soon, capacity: 1 });
    const off = await createEvent(headers, { startsAt: soon, registrationOnSite: false });
    const past = randomUUID();
    await insertRaw({ id: past, published: true, starts_at: '2020-01-01 10:00:00' });
    await request(app).post(`/api/events/${full}/registrations`).send(person);

    const status = async (id: string) => (await request(app).get(`/api/events/${id}`)).body.event.registrationStatus;

    expect(await status(open)).toBe('open');
    expect(await status(few)).toBe('few_left');
    expect(await status(full)).toBe('full');
    expect(await status(off)).toBe('not_on_site');
    expect(await status(past)).toBe('started');
  });
});
