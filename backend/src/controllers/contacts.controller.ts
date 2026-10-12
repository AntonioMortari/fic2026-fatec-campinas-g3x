import type { Request, Response } from 'express';
import type { z } from 'zod';
import { receiveContact } from '../services/contact.service';
import { originHash } from '../utils/origin';
import type { contactBody } from '../validators/contacts.validator';

export async function createContact(req: Request, res: Response): Promise<void> {
  const { name, email, phone, institution, message } = req.body as z.output<typeof contactBody>;
  await receiveContact({ name, email, phone, institution, message }, originHash(req));
  res.status(201).json({ received: true });
}
