import type { Request, Response } from 'express';
import { listPublicFaq } from '../services/faq.service';

export async function listFaq(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listPublicFaq() });
}
