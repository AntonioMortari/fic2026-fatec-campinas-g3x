import { z } from 'zod';
import { nameField, phoneField } from './fields.validator';

export const MAX_MESSAGE_LENGTH = 5000;

const EMAIL_MESSAGE = 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.';
const EMAIL_MISSING_AT_MESSAGE = 'Falta o @. Exemplo: nome@exemplo.com.';
const MESSAGE_REQUIRED = 'Escreva sua mensagem.';

const emailField = z
  .string({ error: EMAIL_MESSAGE })
  .trim()
  .toLowerCase()
  .max(254, 'O e-mail passou de 254 caracteres.')
  .superRefine((value, ctx) => {
    if (z.email().safeParse(value).success) return;
    ctx.addIssue({ code: 'custom', message: value && !value.includes('@') ? EMAIL_MISSING_AT_MESSAGE : EMAIL_MESSAGE });
  });

export const contactBody = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  institution: z
    .string({ error: 'Confira o nome da instituição.' })
    .trim()
    .max(160, 'O nome da instituição passou de 160 caracteres.')
    .nullish()
    .transform((value) => value || null),
  message: z
    .string({ error: MESSAGE_REQUIRED })
    .trim()
    .min(1, MESSAGE_REQUIRED)
    .max(
      MAX_MESSAGE_LENGTH,
      `A mensagem passou de ${MAX_MESSAGE_LENGTH.toLocaleString('pt-BR')} caracteres. Conte o essencial por aqui — a gente responde e continua a conversa por e-mail.`,
    ),
  consent: z.literal(true, { error: 'Para enviar, precisamos que você concorde com o uso dos seus dados para responder esta mensagem.' }),
});
