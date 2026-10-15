import { z } from 'zod';
import { NEWS_KINDS } from '../models';

export const TITLE_LIMIT = 200;
export const SUMMARY_LIMIT = 500;
export const BODY_LIMIT = 20000;
export const ALT_LIMIT = 300;

export const adminNewsParams = z.object({ id: z.uuid('Notícia inválida.') });

// There is no `published` here: saving never publishes, and a hostile body cannot smuggle it in (Zod drops unknown keys).
export const newsBody = z.object({
  kind: z.enum(NEWS_KINDS, { error: 'Escolha entre notícia e campanha.' }).default('news'),
  title: z
    .string({ error: 'Escreva o título.' })
    .trim()
    .min(1, 'Escreva o título.')
    .max(TITLE_LIMIT, `O título passou de ${TITLE_LIMIT} caracteres.`),
  summary: z
    .string({ error: 'O resumo precisa ser escrito em palavras.' })
    .trim()
    .max(SUMMARY_LIMIT, `O resumo passou de ${SUMMARY_LIMIT} caracteres.`)
    .nullish()
    .transform((value) => value || null),
  body: z
    .string({ error: 'Escreva o texto da notícia.' })
    .trim()
    .min(1, 'Escreva o texto da notícia.')
    .max(BODY_LIMIT, `O texto passou de ${BODY_LIMIT} caracteres.`)
    .transform((value) => value.replace(/\r\n?/g, '\n')),
});

export const publicationBody = z.object({ published: z.boolean({ error: 'Informe se a notícia fica publicada.' }) });

const IMAGE_MESSAGE = 'Escolha uma imagem para enviar.';
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

export const imageBody = z.object({
  data: z
    .string({ error: IMAGE_MESSAGE })
    .min(1, IMAGE_MESSAGE)
    .refine((value) => value.length % 4 === 0 && BASE64.test(value), IMAGE_MESSAGE)
    .transform((value) => Buffer.from(value, 'base64')),
  alt: z
    .string({ error: 'Descreva a imagem para quem não a enxerga.' })
    .trim()
    .min(1, 'Descreva a imagem para quem não a enxerga.')
    .max(ALT_LIMIT, `A descrição da imagem passou de ${ALT_LIMIT} caracteres.`),
  authorized: z.literal(true, { error: 'Para subir a imagem, confirme que existe autorização de uso de imagem.' }),
});
