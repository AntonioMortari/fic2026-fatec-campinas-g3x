import type { Request, Response } from 'express';
import { z } from 'zod';
import { updateProfile } from '../services/auth.service';
import { listMyRegistrations } from '../services/my-registrations.service';
import { ApiError } from '../utils/api-error';
import { nameField, personTypeField, phoneField } from './auth.controller';

export async function getMyRegistrations(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ data: await listMyRegistrations(req.user.id) });
}

// Only these three reach the service: Zod drops everything else, so the body cannot name an e-mail or a role.
export const profileBody = z.object({ name: nameField, phone: phoneField, personType: personTypeField });

export async function updateMe(req: Request, res: Response): Promise<void> {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  res.json({ user: await updateProfile(req.user.id, req.body as z.output<typeof profileBody>) });
}
