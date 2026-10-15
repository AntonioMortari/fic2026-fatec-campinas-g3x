import fs from 'node:fs';
import path from 'node:path';
import request from 'supertest';
import { createApp } from '../../src/app';
import { migrator } from '../../src/database/migrate';
import { IMAGES_DIR, seedContent } from '../../src/database/seed-content';
import { SEED_NEWS, SEED_PHOTOS } from '../../src/database/seed-content.data';
import { GalleryPhoto, News, sequelize } from '../../src/models';
import { uploadsDir } from '../../src/utils/event-image-storage';

const app = createApp();

const binary = (res: request.Response, done: (error: Error | null, body: Buffer) => void) => {
  const chunks: Buffer[] = [];
  res.on('data', (chunk: Buffer) => chunks.push(chunk));
  res.on('end', () => done(null, Buffer.concat(chunks)));
};

beforeAll(async () => {
  await migrator.up();
});

beforeEach(async () => {
  await GalleryPhoto.destroy({ where: {} });
  await News.destroy({ where: {} });
});

afterAll(async () => {
  await sequelize.close();
  fs.rmSync(uploadsDir(), { recursive: true, force: true });
});

describe('the content seed against a real MySQL', () => {
  it('puts the news and the albums where the public pages read them, newest news first, with accents intact', async () => {
    await seedContent();

    const list = await request(app).get('/api/news');
    expect(list.status).toBe(200);
    const titles = (list.body.data as { title: string }[]).map((item) => item.title);
    expect(titles).toEqual([...SEED_NEWS].sort((a, b) => b.publishedAt.localeCompare(a.publishedAt)).map((item) => item.title));
    expect(titles[0]).toContain('Cafú e o Café');

    const albums = (await request(app).get('/api/gallery')).body.data as { name: string; photos: { alt: string }[] }[];
    expect(albums.map((album) => album.name)).toEqual([
      'Ateliê Afro Cultural',
      'Brasil Negreiro: Imaginário em Liberdade',
      'Banzo',
      'A Cabaça e o Canto Ancestral',
      'Catirina e Nego Dito',
      'Brincadeiras Encantadas na Mata',
      'Eu Griot',
      'Cafú e o Café',
    ]);
    expect(albums.flatMap((album) => album.photos)).toHaveLength(SEED_PHOTOS.length);
  });

  it('serves the exact bytes of each image through the public routes, and the news detail reads in paragraphs', async () => {
    await seedContent();

    const withImage = SEED_NEWS.find((item) => item.image)!;
    const row = (await News.findOne({ where: { title: withImage.title } }))!;
    const bytes = await request(app).get(`/api/news/${row.id}/image`).buffer(true).parse(binary);
    expect(bytes.status).toBe(200);
    expect((bytes.body as Buffer).equals(fs.readFileSync(path.join(IMAGES_DIR, withImage.image!.file)))).toBe(true);

    const detail = await request(app).get(`/api/news/${row.id}`);
    expect(detail.body.news?.paragraphs ?? detail.body.paragraphs).toHaveLength(withImage.body.split('\n\n').length);

    const photo = SEED_PHOTOS[0]!;
    const photoRow = (await GalleryPhoto.findOne({ where: { alt: photo.alt } }))!;
    const image = await request(app).get(`/api/gallery/${photoRow.id}/image`).buffer(true).parse(binary);
    expect(image.status).toBe(200);
    expect((image.body as Buffer).equals(fs.readFileSync(path.join(IMAGES_DIR, photo.file)))).toBe(true);
  });

  it('records the declaration as a date, so the database trusts the photos it publishes', async () => {
    await seedContent();

    const photos = await GalleryPhoto.findAll();
    expect(photos).toHaveLength(SEED_PHOTOS.length);
    for (const photo of photos) {
      expect(photo.published).toBe(true);
      expect(photo.authorizedAt).toBeInstanceOf(Date);
    }
    const news = (await News.findAll()).filter((item) => item.imageFile);
    for (const item of news) expect(item.imageAuthorizedAt).toBeInstanceOf(Date);
  });

  it('a second run changes nothing, and with force still adds nothing twice', async () => {
    await seedContent();
    const files = fs.readdirSync(uploadsDir()).length;

    expect(await seedContent()).toMatchObject({ skipped: true });
    expect(await seedContent({ force: true })).toEqual({ skipped: false, news: 0, photos: 0 });

    expect(await News.count()).toBe(SEED_NEWS.length);
    expect(await GalleryPhoto.count()).toBe(SEED_PHOTOS.length);
    expect(fs.readdirSync(uploadsDir())).toHaveLength(files);
  });

  it('does not touch a site where staff already published something of their own', async () => {
    await News.create({ title: 'Escrita pela equipe', kind: 'news', body: 'Texto.', summary: null, published: true, publishedAt: new Date() });

    expect(await seedContent()).toMatchObject({ skipped: true });

    expect(await News.count()).toBe(1);
    expect(await GalleryPhoto.count()).toBe(0);
  });
});
