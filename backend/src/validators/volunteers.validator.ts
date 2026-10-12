import { z } from 'zod';
import { VOLUNTEER_STATUSES } from '../models';

export const MESSAGE_LIMIT = 2000;

const AREA_ID = /^[a-z0-9-]{1,40}$/;
const AREAS_MESSAGE = 'Escolha ao menos uma área.';

export const applicationBody = z.object({
  areas: z
    .array(z.string({ error: AREAS_MESSAGE }), { error: AREAS_MESSAGE })
    .min(1, AREAS_MESSAGE)
    .max(20, 'Escolha só entre as áreas da lista.')
    .refine((areas) => areas.every((area) => AREA_ID.test(area)), 'Escolha só entre as áreas da lista.')
    .transform((areas) => [...new Set(areas)]),
  message: z
    .string({ error: 'O texto precisa ser escrito em palavras.' })
    .trim()
    .max(MESSAGE_LIMIT, `O texto passou de ${MESSAGE_LIMIT} caracteres.`)
    .nullish()
    .transform((value) => value || null),
});

export const applicationParams = z.object({ id: z.uuid('Candidatura inválida.') });

export const applicationFilters = z.object({
  status: z.enum(VOLUNTEER_STATUSES, { error: 'Situação inválida.' }).optional(),
  area: z.string().regex(AREA_ID, 'Área inválida.').optional(),
});

export const areaFilter = z.object({ area: z.string().regex(AREA_ID, 'Área inválida.').optional() });

export const statusBody = z.object({ status: z.enum(VOLUNTEER_STATUSES, { error: 'Escolha uma das quatro situações.' }) });
