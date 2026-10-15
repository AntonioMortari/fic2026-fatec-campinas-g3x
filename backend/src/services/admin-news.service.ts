import { News, type NewsKind } from '../models';
import { ApiError } from '../utils/api-error';
import { deleteImageFile, saveImageFile } from '../utils/event-image-storage';
import { detectImageMime } from '../utils/image-signature';
import { newsImage, NOT_FOUND_MESSAGE, type NewsImage } from './news.service';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

const IMAGE_COLUMNS = ['imageFile', 'imageMime', 'imageAlt', 'imageAuthorizedAt', 'imageUpdatedAt'] as const;

export interface AdminNews {
  id: string;
  kind: NewsKind;
  title: string;
  summary: string | null;
  body: string;
  published: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  image: NewsImage | null;
}

export interface NewsInput {
  kind: NewsKind;
  title: string;
  summary: string | null;
  body: string;
}

export interface ImageInput {
  data: Buffer;
  alt: string;
}

const notFound = () => new ApiError(404, 'news_not_found', NOT_FOUND_MESSAGE);

function toAdminNews(news: News): AdminNews {
  return {
    id: news.id,
    kind: news.kind,
    title: news.title,
    summary: news.summary,
    body: news.body,
    published: news.published,
    publishedAt: news.publishedAt?.toISOString() ?? null,
    createdAt: news.createdAt.toISOString(),
    updatedAt: news.updatedAt.toISOString(),
    image: newsImage(news, `/api/admin/news/${news.id}/image`),
  };
}

// `published` and `publishedAt` are not here on purpose: saving never publishes.
const editableColumns = (input: NewsInput) => ({ kind: input.kind, title: input.title, summary: input.summary, body: input.body });

async function findOrFail(id: string): Promise<News> {
  const news = await News.findByPk(id);
  if (!news) throw notFound();
  return news;
}

export async function listAdminNews(): Promise<AdminNews[]> {
  const rows = await News.findAll({ order: [['createdAt', 'DESC']] });
  return rows.map(toAdminNews);
}

export async function getAdminNews(id: string): Promise<AdminNews> {
  return toAdminNews(await findOrFail(id));
}

export async function createNews(input: NewsInput): Promise<AdminNews> {
  return toAdminNews(await News.create({ ...editableColumns(input), published: false }));
}

export async function updateNews(id: string, input: NewsInput): Promise<AdminNews> {
  const news = await findOrFail(id);
  await news.update(editableColumns(input), { fields: ['kind', 'title', 'summary', 'body'] });
  return toAdminNews(news);
}

// The date is stamped on the first publication only; taking it down keeps it, because it is a fact.
export async function setNewsPublished(id: string, published: boolean, now: Date = new Date()): Promise<AdminNews> {
  const news = await findOrFail(id);
  const stampsDate = published && !news.publishedAt;
  await news.update(stampsDate ? { published, publishedAt: now } : { published }, { fields: stampsDate ? ['published', 'publishedAt'] : ['published'] });
  return toAdminNews(news);
}

const imageError = (status: number, code: string, message: string) =>
  new ApiError(status, code, message, [{ location: 'body', field: 'data', message }]);

export async function setNewsImage(id: string, input: ImageInput, now: Date = new Date()): Promise<AdminNews> {
  const current = await News.findByPk(id, { attributes: ['id', 'imageFile'] });
  if (!current) throw notFound();
  if (input.data.length > MAX_IMAGE_BYTES) {
    throw imageError(413, 'image_too_large', 'A imagem passou de 4 MB. Escolha uma menor.');
  }
  const mime = detectImageMime(input.data);
  if (!mime) throw imageError(400, 'invalid_image', 'O arquivo não é uma imagem JPG, PNG, GIF ou WebP.');

  const file = await saveImageFile(input.data, mime);
  try {
    await News.update(
      { imageFile: file, imageMime: mime, imageAlt: input.alt, imageAuthorizedAt: now, imageUpdatedAt: now },
      { where: { id }, fields: [...IMAGE_COLUMNS] },
    );
  } catch (error) {
    await deleteImageFile(file);
    throw error;
  }
  await deleteImageFile(current.imageFile);
  return getAdminNews(id);
}

export async function removeNewsImage(id: string): Promise<AdminNews> {
  const current = await News.findByPk(id, { attributes: ['id', 'imageFile'] });
  if (!current) throw notFound();
  await News.update(
    { imageFile: null, imageMime: null, imageAlt: null, imageAuthorizedAt: null, imageUpdatedAt: null },
    { where: { id }, fields: [...IMAGE_COLUMNS] },
  );
  await deleteImageFile(current.imageFile);
  return getAdminNews(id);
}

export async function findNewsImageForStaff(id: string): Promise<News> {
  const news = await News.findOne({ attributes: ['id', 'imageFile', 'imageMime', 'imageUpdatedAt'], where: { id } });
  if (!news) throw notFound();
  if (!news.imageFile) throw new ApiError(404, 'image_not_found', 'Esta notícia não tem imagem.');
  return news;
}
