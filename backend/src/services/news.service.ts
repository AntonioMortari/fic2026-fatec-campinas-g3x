import { News, type NewsKind } from '../models';

export interface NewsImage {
  url: string;
  alt: string;
}

export interface PublicNewsItem {
  id: string;
  kind: NewsKind;
  title: string;
  excerpt: string;
  publishedAt: string | null;
  image: NewsImage | null;
}

export interface PublicNewsDetail extends Omit<PublicNewsItem, 'excerpt'> {
  summary: string | null;
  paragraphs: string[];
}

export const NOT_FOUND_MESSAGE = 'Não encontramos essa notícia.';

// Paragraphs are separated by a blank line; there is no other formatting.
export function toParagraphs(body: string): string[] {
  return body
    .split(/\r?\n[ \t]*\r?\n/)
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function newsImage(news: Pick<News, 'imageUpdatedAt' | 'imageAlt'>, url: string): NewsImage | null {
  return news.imageUpdatedAt && news.imageAlt ? { url: `${url}?v=${news.imageUpdatedAt.getTime()}`, alt: news.imageAlt } : null;
}

const publicImage = (news: News) => newsImage(news, `/api/news/${news.id}/image`);

function toItem(news: News): PublicNewsItem {
  return {
    id: news.id,
    kind: news.kind,
    title: news.title,
    excerpt: news.summary || toParagraphs(news.body)[0] || '',
    publishedAt: news.publishedAt?.toISOString() ?? null,
    image: publicImage(news),
  };
}

export async function listPublishedNews(): Promise<PublicNewsItem[]> {
  const rows = await News.findAll({ where: { published: true }, order: [['publishedAt', 'DESC'], ['createdAt', 'DESC']] });
  return rows.map(toItem);
}

export async function findPublishedNews(id: string): Promise<News | null> {
  return News.findOne({ where: { id, published: true } });
}

export async function getPublishedNews(id: string): Promise<PublicNewsDetail | null> {
  const news = await findPublishedNews(id);
  if (!news) return null;
  return {
    id: news.id,
    kind: news.kind,
    title: news.title,
    summary: news.summary,
    paragraphs: toParagraphs(news.body),
    publishedAt: news.publishedAt?.toISOString() ?? null,
    image: publicImage(news),
  };
}

export async function findPublishedNewsImage(id: string): Promise<News | null> {
  const news = await News.findOne({ attributes: ['id', 'imageFile', 'imageMime', 'imageUpdatedAt'], where: { id, published: true } });
  return news?.imageFile ? news : null;
}
