import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
  createFaqItem,
  createFaqTheme,
  listAdminFaq,
  moveFaqItem,
  moveFaqTheme,
  renameFaqTheme,
  setFaqItemPublished,
  setFaqThemePublished,
  updateFaqItem,
} from '../services/admin-faq.service';
import type { faqItemBody, faqPositionBody, faqPublicationBody, faqThemeBody } from '../validators/admin-faq.validator';

type Item = z.output<typeof faqItemBody>;
const id = (req: Request) => req.params.id as string;

export async function listForStaff(_req: Request, res: Response): Promise<void> {
  res.json(await listAdminFaq());
}

export async function createItem(req: Request, res: Response): Promise<void> {
  res.status(201).json({ item: await createFaqItem(req.body as Item) });
}

export async function updateItem(req: Request, res: Response): Promise<void> {
  res.json({ item: await updateFaqItem(id(req), req.body as Item) });
}

export async function setItemPublication(req: Request, res: Response): Promise<void> {
  res.json({ item: await setFaqItemPublished(id(req), (req.body as z.output<typeof faqPublicationBody>).published) });
}

export async function moveItem(req: Request, res: Response): Promise<void> {
  res.json({ item: await moveFaqItem(id(req), (req.body as z.output<typeof faqPositionBody>).direction) });
}

export async function createTheme(req: Request, res: Response): Promise<void> {
  res.status(201).json({ theme: await createFaqTheme((req.body as z.output<typeof faqThemeBody>).name) });
}

export async function renameTheme(req: Request, res: Response): Promise<void> {
  res.json({ theme: await renameFaqTheme(id(req), (req.body as z.output<typeof faqThemeBody>).name) });
}

export async function setThemePublication(req: Request, res: Response): Promise<void> {
  res.json({ theme: await setFaqThemePublished(id(req), (req.body as z.output<typeof faqPublicationBody>).published) });
}

export async function moveTheme(req: Request, res: Response): Promise<void> {
  res.json({ theme: await moveFaqTheme(id(req), (req.body as z.output<typeof faqPositionBody>).direction) });
}
