import fs from 'node:fs/promises';
import path from 'node:path';
import { env } from '../config/env';
import { GalleryPhoto, News, sequelize } from '../models';
import { deleteImageFile, saveImageFile } from '../utils/event-image-storage';
import { detectImageMime, type ImageMime } from '../utils/image-signature';
import { SEED_NEWS, SEED_PHOTOS } from './seed-content.data';

// backend/seed-content/images: outside src so the build does not copy it; the production image copies it next to dist.
export const IMAGES_DIR = path.resolve(__dirname, '../../seed-content/images');

export interface SeedContentOptions {
  force?: boolean;
  now?: Date;
  imagesDir?: string;
}

export interface SeedContentResult {
  skipped: boolean;
  news: number;
  photos: number;
}

interface LoadedImage {
  data: Buffer;
  mime: ImageMime;
}

// Reads every file before the first write, so a file missing from the image is found at once and not halfway through.
async function loadImages(files: string[], dir: string): Promise<Map<string, LoadedImage>> {
  const images = new Map<string, LoadedImage>();
  for (const file of new Set(files)) {
    let data: Buffer;
    try {
      data = await fs.readFile(path.join(dir, file));
    } catch {
      throw new Error(`Imagem da seed de conteúdo não encontrada: ${file} (procurada em ${dir}).`);
    }
    const mime = detectImageMime(data);
    if (!mime) throw new Error(`O arquivo da seed de conteúdo não é uma imagem: ${file}.`);
    images.set(file, { data, mime });
  }
  return images;
}

// A file is written before its row, and removed if the row is refused: a failed start leaves nothing orphaned.
async function withStoredImage<T>(image: LoadedImage, write: (file: string) => Promise<T>): Promise<T> {
  const file = await saveImageFile(image.data, image.mime);
  try {
    return await write(file);
  } catch (error) {
    await deleteImageFile(file);
    throw error;
  }
}

// Puts the ONG's real content on a site that has none. It runs only when there is no news and no photo yet, so a
// restart never brings back what staff deleted; `force` adds just what is missing, matching by title (news) or by
// album and description (photo). The declaration of image use is recorded as the date of the seed: the photos are of
// the ONG's own artists and were handed over by the ONG for the site, but its written authorization still has to be kept.
export async function seedContent({ force = false, now = new Date(), imagesDir = IMAGES_DIR }: SeedContentOptions = {}): Promise<SeedContentResult> {
  const images = await loadImages([...SEED_PHOTOS.map((photo) => photo.file), ...SEED_NEWS.flatMap((item) => (item.image ? [item.image.file] : []))], imagesDir);

  if (!force && (await News.count()) + (await GalleryPhoto.count()) > 0) return { skipped: true, news: 0, photos: 0 };

  let news = 0;
  for (const item of SEED_NEWS) {
    if (await News.findOne({ attributes: ['id'], where: { title: item.title } })) continue;
    const image = item.image ? images.get(item.image.file)! : null;
    const columns = { title: item.title, kind: item.kind, summary: item.summary, body: item.body, published: true, publishedAt: new Date(item.publishedAt) };
    if (image && item.image) {
      await withStoredImage(image, (file) =>
        News.create({ ...columns, imageFile: file, imageMime: image.mime, imageAlt: item.image!.alt, imageAuthorizedAt: now, imageUpdatedAt: now }),
      );
    } else {
      await News.create(columns);
    }
    news += 1;
  }

  let photos = 0;
  for (const [index, photo] of SEED_PHOTOS.entries()) {
    if (await GalleryPhoto.findOne({ attributes: ['id'], where: { album: photo.album, alt: photo.alt } })) continue;
    const image = images.get(photo.file)!;
    // One second apart, oldest first: the public page orders albums by the newest photo on air.
    const publishedAt = new Date(now.getTime() - (SEED_PHOTOS.length - 1 - index) * 1000);
    await withStoredImage(image, (file) =>
      GalleryPhoto.create({
        album: photo.album,
        alt: photo.alt,
        caption: photo.caption,
        imageFile: file,
        imageMime: image.mime,
        imageUpdatedAt: now,
        authorizedAt: now,
        published: true,
        publishedAt,
      }),
    );
    photos += 1;
  }

  return { skipped: false, news, photos };
}

if (require.main === module) {
  const force = process.argv.includes('--force');
  seedContent({ force })
    .then((result) => {
      if (result.skipped) console.log('[seed-content] o site já tem notícias ou fotos; nada foi feito (use --force para acrescentar só o que falta)');
      else console.log('[seed-content] %d notícias e %d fotos publicadas (imagens em %s)', result.news, result.photos, env.UPLOADS_DIR);
      return sequelize.close();
    })
    .catch(async (error: unknown) => {
      console.error('[seed-content]', error instanceof Error ? error.message : error);
      await sequelize.close();
      process.exit(1);
    });
}
