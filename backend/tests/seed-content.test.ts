import fs from 'node:fs';
import path from 'node:path';
import { GalleryPhoto, News } from '../src/models';
import { IMAGES_DIR, seedContent } from '../src/database/seed-content';
import { SEED_NEWS, SEED_PHOTOS } from '../src/database/seed-content.data';
import { toParagraphs } from '../src/services/news.service';
import { ALBUM_LIMIT, ALT_LIMIT as PHOTO_ALT_LIMIT, CAPTION_LIMIT } from '../src/validators/admin-gallery.validator';
import { ALT_LIMIT as NEWS_ALT_LIMIT, BODY_LIMIT, SUMMARY_LIMIT, TITLE_LIMIT } from '../src/validators/admin-news.validator';
import { detectImageMime } from '../src/utils/image-signature';
import { uploadsDir } from '../src/utils/event-image-storage';

const NOW = new Date('2026-10-16T12:00:00Z');
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

afterEach(() => jest.restoreAllMocks());
afterAll(() => fs.rmSync(uploadsDir(), { recursive: true, force: true }));

const filesInDir = () => (fs.existsSync(uploadsDir()) ? fs.readdirSync(uploadsDir()) : []);

describe('the content that ships with the first start', () => {
  const images = [...SEED_PHOTOS.map((photo) => photo.file), ...SEED_NEWS.flatMap((item) => (item.image ? [item.image.file] : []))];

  it('has news and photos, and every image file exists, is a real image and fits the 4 MB the panel accepts', () => {
    expect(SEED_NEWS.length).toBeGreaterThan(0);
    expect(SEED_PHOTOS.length).toBeGreaterThan(0);
    for (const file of new Set(images)) {
      const bytes = fs.readFileSync(path.join(IMAGES_DIR, file));
      expect(detectImageMime(bytes)).not.toBeNull();
      expect(bytes.length).toBeLessThanOrEqual(MAX_IMAGE_BYTES);
    }
  });

  it('has no file in the images folder that nothing uses', () => {
    expect(fs.readdirSync(IMAGES_DIR).sort()).toEqual([...new Set(images)].sort());
  });

  it('fits every column limit the panel enforces, so it could have been typed in by staff', () => {
    for (const item of SEED_NEWS) {
      expect(item.title.length).toBeLessThanOrEqual(TITLE_LIMIT);
      expect(item.summary.length).toBeLessThanOrEqual(SUMMARY_LIMIT);
      expect(item.body.length).toBeLessThanOrEqual(BODY_LIMIT);
      expect(toParagraphs(item.body).length).toBeGreaterThan(0);
      if (item.image) expect(item.image.alt.length).toBeLessThanOrEqual(NEWS_ALT_LIMIT);
    }
    for (const photo of SEED_PHOTOS) {
      expect(photo.album.length).toBeLessThanOrEqual(ALBUM_LIMIT);
      expect(photo.alt.length).toBeLessThanOrEqual(PHOTO_ALT_LIMIT);
      expect((photo.caption ?? '').length).toBeLessThanOrEqual(CAPTION_LIMIT);
    }
  });

  it('describes every image in words, for whoever cannot see it', () => {
    for (const photo of SEED_PHOTOS) expect(photo.alt.trim().length).toBeGreaterThan(20);
    for (const item of SEED_NEWS) if (item.image) expect(item.image.alt.trim().length).toBeGreaterThan(20);
  });

  it('has valid, past dates for the news, unique titles, and only the two kinds the panel knows', () => {
    expect(new Set(SEED_NEWS.map((item) => item.title)).size).toBe(SEED_NEWS.length);
    for (const item of SEED_NEWS) {
      const date = new Date(item.publishedAt);
      expect(Number.isNaN(date.getTime())).toBe(false);
      expect(date.getTime()).toBeLessThan(NOW.getTime());
      expect(['news', 'campaign']).toContain(item.kind);
    }
  });

  it('keeps unfinished text out: no placeholder, no lorem ipsum (the content is the ONG\'s, never invented)', () => {
    const text = JSON.stringify([SEED_NEWS, SEED_PHOTOS]).toLowerCase();
    for (const forbidden of ['lorem', 'ipsum', 'todo', 'xxx', 'a preencher', 'placeholder']) expect(text).not.toContain(forbidden);
  });
});

describe('seedContent', () => {
  function stubEmptyDatabase() {
    jest.spyOn(News, 'count').mockResolvedValue(0);
    jest.spyOn(GalleryPhoto, 'count').mockResolvedValue(0);
    jest.spyOn(News, 'findOne').mockResolvedValue(null);
    jest.spyOn(GalleryPhoto, 'findOne').mockResolvedValue(null);
    return {
      news: jest.spyOn(News, 'create').mockResolvedValue({} as News),
      photo: jest.spyOn(GalleryPhoto, 'create').mockResolvedValue({} as GalleryPhoto),
    };
  }

  it('publishes every piece with the date it happened, the image stored on disk and the declaration recorded as a date', async () => {
    const { news, photo } = stubEmptyDatabase();

    const result = await seedContent({ now: NOW });

    expect(result).toEqual({ skipped: false, news: SEED_NEWS.length, photos: SEED_PHOTOS.length });
    expect(news).toHaveBeenCalledTimes(SEED_NEWS.length);
    for (const [index, item] of SEED_NEWS.entries()) {
      const values = news.mock.calls[index]![0] as Record<string, unknown>;
      expect(values).toMatchObject({ title: item.title, kind: item.kind, summary: item.summary, body: item.body, published: true });
      expect(values.publishedAt).toEqual(new Date(item.publishedAt));
      if (item.image) {
        expect(values.imageFile).toMatch(/^[0-9a-f-]{36}\.jpg$/);
        expect(values).toMatchObject({ imageMime: 'image/jpeg', imageAlt: item.image.alt, imageAuthorizedAt: NOW, imageUpdatedAt: NOW });
      } else {
        expect(values.imageFile ?? null).toBeNull();
        expect(values.imageAuthorizedAt ?? null).toBeNull();
      }
    }
    expect(photo).toHaveBeenCalledTimes(SEED_PHOTOS.length);
    for (const call of photo.mock.calls) {
      expect(call[0]).toMatchObject({ published: true, authorizedAt: NOW, imageMime: 'image/jpeg' });
    }
    expect(filesInDir()).toHaveLength(SEED_NEWS.filter((item) => item.image).length + SEED_PHOTOS.length);
  });

  it('puts the photos on air in the order of the list, so the albums come out in a chosen order', async () => {
    const { photo } = stubEmptyDatabase();

    await seedContent({ now: NOW });

    const times = photo.mock.calls.map((call) => ((call[0] as { publishedAt: Date }).publishedAt).getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
    expect(new Set(times).size).toBe(times.length);
    expect(Math.max(...times)).toBeLessThanOrEqual(NOW.getTime());
  });

  it('does nothing when the site already has news or photos, so a restart never brings back what staff deleted', async () => {
    const { news, photo } = stubEmptyDatabase();
    jest.spyOn(GalleryPhoto, 'count').mockResolvedValue(1);
    const before = filesInDir().length;

    const result = await seedContent({ now: NOW });

    expect(result).toEqual({ skipped: true, news: 0, photos: 0 });
    expect(news).not.toHaveBeenCalled();
    expect(photo).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it('with force, adds only what is missing: a title or album and description that already exist are left alone', async () => {
    const { news, photo } = stubEmptyDatabase();
    jest.spyOn(News, 'count').mockResolvedValue(3);
    jest.spyOn(News, 'findOne').mockImplementation((async (options: { where?: { title?: string } }) =>
      options?.where?.title === SEED_NEWS[0]!.title ? ({ id: 'x' } as News) : null) as never);
    jest.spyOn(GalleryPhoto, 'findOne').mockImplementation((async (options: { where?: { alt?: string } }) =>
      options?.where?.alt === SEED_PHOTOS[0]!.alt ? ({ id: 'y' } as GalleryPhoto) : null) as never);

    const result = await seedContent({ now: NOW, force: true });

    expect(result).toEqual({ skipped: false, news: SEED_NEWS.length - 1, photos: SEED_PHOTOS.length - 1 });
    expect(news).toHaveBeenCalledTimes(SEED_NEWS.length - 1);
    expect(photo).toHaveBeenCalledTimes(SEED_PHOTOS.length - 1);
  });

  it('removes the file when the row could not be written, and stops with the reason', async () => {
    stubEmptyDatabase();
    const create = jest.spyOn(News, 'create').mockRejectedValueOnce(new Error('banco recusou'));
    const before = filesInDir().length;

    await expect(seedContent({ now: NOW })).rejects.toThrow('banco recusou');

    expect(create).toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });

  it('refuses a missing image file with a message that names it, before writing anything', async () => {
    const { news } = stubEmptyDatabase();
    const before = filesInDir().length;

    await expect(seedContent({ now: NOW, imagesDir: path.join(IMAGES_DIR, 'nao-existe') })).rejects.toThrow(/imagem|\.jpg/i);

    expect(news).not.toHaveBeenCalled();
    expect(filesInDir()).toHaveLength(before);
  });
});
