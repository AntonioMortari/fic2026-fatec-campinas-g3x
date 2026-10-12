import { z } from 'zod';

const PHONE_MESSAGE = 'O telefone precisa incluir o DDD, como (11) 95396-8344.';
const PHONE_MISSING_DIGIT_MESSAGE = 'Falta um dígito. Exemplo: (11) 98765-4321.';

export const nameField = z.string({ error: 'Escreva seu nome.' }).trim().min(1, 'Escreva seu nome.').max(120, 'O nome passou de 120 caracteres.');

export const phoneField = z
  .string({ error: PHONE_MESSAGE })
  .trim()
  .nullish()
  .superRefine((value, ctx) => {
    if (!value) return;
    const digits = value.replace(/\D/g, '');
    if (/^\d{10,11}$/.test(digits)) return;
    ctx.addIssue({ code: 'custom', message: digits.length === 9 ? PHONE_MISSING_DIGIT_MESSAGE : PHONE_MESSAGE });
  })
  .transform((value) => (value ? value.replace(/\D/g, '') : null));

export const personTypeField = z.enum(['individual', 'organization'], { error: 'Escolha se a conta é de uma pessoa ou de uma instituição.' });
