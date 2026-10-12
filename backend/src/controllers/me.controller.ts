import type { Request, Response } from 'express';
import type { z } from 'zod';
import { updateProfile } from '../services/auth.service';
import { listMyRegistrations } from '../services/my-registrations.service';
import { ApiError } from '../utils/api-error';
import type { profileBody } from '../validators/me.validator';

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ data: await listMyRegistrations(req.user.id) });
}

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ user: await updateProfile(req.user.id, req.body as z.output<typeof profileBody>) });
}
