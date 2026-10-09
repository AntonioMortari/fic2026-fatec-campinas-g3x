import type { Request, Response } from 'express';
import { ApiError } from '../utils/api-error';
import { listMyRegistrations } from '../services/my-registrations.service';

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ data: await listMyRegistrations(req.user.id) });
}
