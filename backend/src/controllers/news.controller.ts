import type { Request, Response } from 'express';
import { findPublishedNewsImage, getPublishedNews, listPublishedNews, NOT_FOUND_MESSAGE } from '../services/news.service';
import { ApiError } from '../utils/api-error';
import { sendStoredImage } from '../utils/send-stored-image';

export async function listNews(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listPublishedNews() });
}

export async function getNews(req: Request, res: Response): Promise<void> {
  const news = await getPublishedNews(req.params.id as string);
  if (!news) throw new ApiError(404, 'news_not_found', NOT_FOUND_MESSAGE);
  res.json({ news });
}

export async function getNewsImage(req: Request, res: Response): Promise<void> {
  const news = await findPublishedNewsImage(req.params.id as string);
  if (!news) throw new ApiError(404, 'image_not_found', 'Esta notícia não tem imagem.');
  await sendStoredImage(res, news, 'public, max-age=3600', 'Esta notícia não tem imagem.');
}
