import { z } from 'zod';
import { localToUtc } from '../utils/time-zone';

const DATE_MESSAGE = 'Informe a data e a hora de início.';
const END_MESSAGE = 'Informe a data e a hora do término, ou deixe em branco.';

const optionalText = (max: number, label: string) =>
  z
    .string({ error: `${label}: resposta inválida.` })
    .trim()
    .max(max, `${label} passou de ${max} caracteres.`)
    .nullish()
    .transform((value) => value || null);

const localDateTime = (message: string) =>
  z
    .string({ error: message })
    .trim()
    .refine((value) => localToUtc(value) !== null, message)
    .transform((value) => localToUtc(value) as Date);

// `published` is not here on purpose: Zod drops it from the body, so saving cannot publish (RF13).
export const eventBody = z
  .object({
    title: z.string({ error: 'Escreva o título.' }).trim().min(1, 'Escreva o título.').max(200, 'O título passou de 200 caracteres.'),
    description: optionalText(5000, 'A descrição'),
    category: optionalText(80, 'O tipo'),
    startsAt: localDateTime(DATE_MESSAGE),
    endsAt: z
      .string({ error: END_MESSAGE })
      .trim()
      .nullish()
      .transform((value, ctx) => {
        if (!value) return null;
        const date = localToUtc(value);
        if (!date) ctx.addIssue({ code: 'custom', message: END_MESSAGE });
        return date;
      }),
    location: optionalText(200, 'O local'),
    ageRange: optionalText(80, 'A faixa etária'),
    capacity: z
      .number({ error: 'O limite de vagas precisa ser um número inteiro, ou fique em branco.' })
      .int('O limite de vagas precisa ser um número inteiro, ou fique em branco.')
      .min(1, 'O limite de vagas precisa ser 1 ou mais, ou fique em branco.')
      .max(100_000, 'O limite de vagas passou de 100 mil.')
      .nullish()
      .transform((value) => value ?? null),
    requiresCpf: z.boolean({ error: 'Resposta inválida.' }).default(false),
  })
  .superRefine((data, ctx) => {
    if (data.endsAt && data.endsAt <= data.startsAt) {
      ctx.addIssue({ code: 'custom', path: ['endsAt'], message: 'O término precisa ser depois do início.' });
    }
  });

export const publicationBody = z.object({ published: z.boolean({ error: 'Informe se o evento fica publicado.' }) });

export const adminEventParams = z.object({ id: z.uuid('Evento inválido.') });

export const attendanceParams = z.object({ id: z.uuid('Evento inválido.'), registrationId: z.uuid('Inscrição inválida.') });

// null clears the mark: "nobody checked" is a state of its own.
export const attendanceBody = z.object({
  attended: z.boolean({ error: 'Informe se a pessoa veio, não veio, ou deixe sem marcar.' }).nullable(),
});
