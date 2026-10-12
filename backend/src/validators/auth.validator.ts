import { z } from 'zod';
import { nameField, personTypeField, phoneField } from './fields.validator';

const MAX_PASSWORD_BYTES = 72;
const EMAIL_MESSAGE = 'Confira o e-mail: ele precisa ter um endereço completo, como nome@exemplo.com.';
const PASSWORD_MIN_MESSAGE = 'A senha precisa ter pelo menos 8 caracteres.';

const emailField = z
  .string({ error: EMAIL_MESSAGE })
  .trim()
  .toLowerCase()
  .max(254, 'O e-mail passou de 254 caracteres.')
  .pipe(z.email(EMAIL_MESSAGE));

const fitsBcrypt = (value: string) => Buffer.byteLength(value) <= MAX_PASSWORD_BYTES;

const registerFields = z.object({
  name: nameField,
  email: emailField,
  phone: phoneField,
  personType: personTypeField,
  password: z
    .string({ error: PASSWORD_MIN_MESSAGE })
    .min(8, PASSWORD_MIN_MESSAGE)
    .refine(fitsBcrypt, 'A senha é longa demais. Use no máximo 72 caracteres (acentos e símbolos contam mais de um).'),
  wantsToVolunteer: z.boolean({ error: 'Resposta inválida.' }).default(false),
  wantsToDonate: z.boolean({ error: 'Resposta inválida.' }).default(false),
  confirmsAdult: z.literal(true, {
    error:
      'Só quem tem 18 anos ou mais pode criar uma conta. Crianças e adolescentes participam das atividades por inscrição feita por um responsável.',
  }),
  consent: z.literal(true, { error: 'Para criar a conta, precisamos que você concorde com o uso dos seus dados.' }),
});

// An intersection, not a refine on registerFields: a refine is skipped when any other field fails by type,
// and the person would only see this error after fixing the rest.
const participation = z
  .object({ wantsToVolunteer: z.boolean().default(false), wantsToDonate: z.boolean().default(false) })
  .superRefine((data, ctx) => {
    if (!data.wantsToVolunteer && !data.wantsToDonate) {
      ctx.addIssue({
        code: 'custom',
        path: ['participation'],
        message: 'Escolha ao menos uma forma de participar: voluntariado, doação, ou as duas.',
      });
    }
  });

export const registerBody = registerFields.and(participation);

export const loginBody = z.object({
  email: emailField,
  password: z
    .string({ error: 'Escreva sua senha.' })
    .min(1, 'Escreva sua senha.')
    .refine(fitsBcrypt, 'E-mail ou senha não conferem.'),
});
