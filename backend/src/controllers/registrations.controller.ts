import type { Request, Response } from 'express';
import { z } from 'zod';
import { cancelRegistration, getCancelPreview } from '../services/cancel-registration.service';

export const cancelParams = z.object({ code: z.uuid('Link inválido.') });

export async function previewCancellation(req: Request, res: Response): Promise<void> {
  res.json({ registration: await getCancelPreview(req.params.code as string) });
}

export async function cancel(req: Request, res: Response): Promise<void> {
  res.json({ registration: await cancelRegistration(req.params.code as string) });
}
