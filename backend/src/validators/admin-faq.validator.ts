import { z } from 'zod';
import { FAQ_LINK_PATHS, FAQ_SOURCE_IDS } from '../utils/faq-pages';

export const QUESTION_LIMIT = 200;
export const ANSWER_LIMIT = 2000;
export const THEME_NAME_LIMIT = 40;

const slug = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Endereço inválido.').max(60, 'Endereço inválido.');

export const faqItemParams = z.object({ id: slug });
export const faqThemeParams = z.object({ id: slug });

// There is no `published` here: saving never publishes, and a hostile body cannot smuggle it in (Zod drops unknown keys).
export const faqItemBody = z.object({
  question: z
    .string({ error: 'Escreva a pergunta.' })
    .trim()
    .min(1, 'Escreva a pergunta.')
    .max(QUESTION_LIMIT, `A pergunta passou de ${QUESTION_LIMIT} caracteres.`),
  answer: z
    .string({ error: 'Escreva a resposta.' })
    .trim()
    .min(1, 'Escreva a resposta.')
    .max(ANSWER_LIMIT, `A resposta passou de ${ANSWER_LIMIT} caracteres.`)
    .transform((value) => value.replace(/\r\n?/g, '\n')),
  themeId: slug,
  linkTo: z
    .enum(FAQ_LINK_PATHS, { error: 'Escolha uma das páginas da lista para o link.' })
    .nullish()
    .transform((value) => value ?? null),
  source: z.enum(FAQ_SOURCE_IDS, { error: 'Diga em que página do site esta resposta já está escrita.' }),
});

export const faqThemeBody = z.object({
  name: z
    .string({ error: 'Escreva o nome do tema.' })
    .trim()
    .min(1, 'Escreva o nome do tema.')
    .max(THEME_NAME_LIMIT, `O nome passou de ${THEME_NAME_LIMIT} caracteres.`),
});

export const faqPublicationBody = z.object({ published: z.boolean({ error: 'Informe se fica no ar.' }) });
export const faqPositionBody = z.object({ direction: z.enum(['up', 'down'], { error: 'Informe se sobe ou desce.' }) });
