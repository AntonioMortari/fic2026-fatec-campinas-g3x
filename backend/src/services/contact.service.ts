import { Op } from 'sequelize';
import { Contact } from '../models';
import { ApiError } from '../utils/api-error';

export const MAX_CONTACTS_PER_ORIGIN_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

export interface ContactInput {
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  message: string;
}

export async function receiveContact(input: ContactInput, origin: string | null, now: Date = new Date()): Promise<void> {
  if (origin) {
    const recent = await Contact.count({ where: { originHash: origin, createdAt: { [Op.gte]: new Date(now.getTime() - HOUR_MS) } } });
    if (recent >= MAX_CONTACTS_PER_ORIGIN_PER_HOUR) {
      throw new ApiError(429, 'too_many_requests', 'Chegaram muitas mensagens por esta conexão. Tente de novo daqui a pouco ou chame no WhatsApp.');
    }
  }

  await Contact.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    institution: input.institution,
    message: input.message,
    consentedAt: now,
    originHash: origin,
  });
}
