import { z } from 'zod';

export const listEventsQuery = z.object({
  period: z.enum(['upcoming', 'past']).default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const eventParams = z.object({ id: z.uuid() });

const PHONE_MESSAGE = 'O telefone precisa incluir o DDD, como (11) 95396-8344.';
const EMAIL_MESSAGE = 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.';

const phoneDigits = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .nullish()
    .refine((value) => !value || /^\d{10,11}$/.test(value.replace(/\D/g, '')), message)
    .transform((value) => (value ? value.replace(/\D/g, '') : null));

const registrationFields = z.object({
  name: z
    .string({ error: 'Escreva o nome de quem vai participar.' })
    .trim()
    .min(1, 'Escreva o nome de quem vai participar.')
    .max(120, 'O nome passou de 120 caracteres.'),
  email: z
    .string({ error: EMAIL_MESSAGE })
    .trim()
    .toLowerCase()
    .max(254, 'O e-mail passou de 254 caracteres.')
    .pipe(z.email(EMAIL_MESSAGE)),
  phone: phoneDigits(PHONE_MESSAGE),
  // Whether it is required depends on the event, so the service decides; here it is only cleaned up.
  cpf: z
    .string({ error: 'Confira o CPF: ele precisa ter 11 números válidos.' })
    .trim()
    .max(20, 'Confira o CPF: ele precisa ter 11 números válidos.')
    .nullish()
    .transform((value) => (value ? value.replace(/\D/g, '') : null)),
  isMinor: z.boolean({ error: 'Resposta inválida.' }).default(false),
  imageAuthorized: z.boolean({ error: 'Resposta inválida.' }).default(false),
  consent: z.literal(true, { error: 'Para se inscrever, precisamos que você concorde com o uso dos seus dados.' }),
});

// Its own object, over the keys the guardian rule needs, so the rule is judged even when another field is wrong.
// `isMinor` comes out the same on both sides, which is what lets the two be merged.
const guardian = z
  .object({
    isMinor: z.boolean().default(false),
    guardianName: z.string().trim().max(120, 'O nome do responsável passou de 120 caracteres.').nullish(),
    guardianPhone: phoneDigits('O telefone do responsável precisa incluir o DDD, como (11) 95396-8344.'),
  })
  .superRefine((data, ctx) => {
    if (!data.isMinor) return;
    if (!data.guardianName) ctx.addIssue({ code: 'custom', path: ['guardianName'], message: 'Escreva o nome de quem responde por quem vai participar.' });
    if (!data.guardianPhone) ctx.addIssue({ code: 'custom', path: ['guardianPhone'], message: 'Escreva o telefone do responsável, com DDD.' });
  })
  .transform((data) => ({
    isMinor: data.isMinor,
    guardianName: data.isMinor ? (data.guardianName ?? null) : null,
    guardianPhone: data.isMinor ? data.guardianPhone : null,
  }));

export const registrationBody = registrationFields.and(guardian);
