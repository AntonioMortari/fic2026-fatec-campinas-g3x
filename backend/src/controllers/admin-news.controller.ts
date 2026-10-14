import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
  createNews,
  findNewsImageForStaff,
  getAdminNews,
  listAdminNews,
  removeNewsImage,
  setNewsImage,
  setNewsPublished,
  updateNews,
} from '../services/admin-news.service';
import { sendStoredImage } from '../utils/send-stored-image';
import type { imageBody, newsBody, publicationBody } from '../validators/admin-news.validator';

export async function listNewsForStaff(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listAdminNews() });
}

export async function getNewsForStaff(req: Request, res: Response): Promise<void> {
  res.json({ news: await getAdminNews(req.params.id as string) });
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json({ news: await createNews(req.body as z.output<typeof newsBody>) });
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json({ news: await updateNews(req.params.id as string, req.body as z.output<typeof newsBody>) });
}

export async function setPublication(req: Request, res: Response): Promise<void> {
  const { published } = req.body as z.output<typeof publicationBody>;
  res.json({ news: await setNewsPublished(req.params.id as string, published) });
}

export async function putImage(req: Request, res: Response): Promise<void> {
  const { data, alt } = req.body as z.output<typeof imageBody>;
  res.json({ news: await setNewsImage(req.params.id as string, { data, alt }) });
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
  res.json({ news: await removeNewsImage(req.params.id as string) });
}

export async function getImage(req: Request, res: Response): Promise<void> {
  await sendStoredImage(res, await findNewsImageForStaff(req.params.id as string), 'private, no-store', 'Esta notícia não tem imagem.');
}
