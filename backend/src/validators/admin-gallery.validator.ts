import { z } from 'zod';

export const ALBUM_LIMIT = 120;
export const ALT_LIMIT = 300;
export const CAPTION_LIMIT = 300;

export const adminGalleryParams = z.object({ id: z.uuid('Foto inválida.') });

const IMAGE_MESSAGE = 'Escolha uma foto para enviar.';
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/;

// There is no `published` here: uploading never publishes, and a hostile body cannot smuggle it in (Zod drops unknown keys).
export const uploadBody = z.object({
  data: z
    .string({ error: IMAGE_MESSAGE })
    .min(1, IMAGE_MESSAGE)
    .refine((value) => value.length % 4 === 0 && BASE64.test(value), IMAGE_MESSAGE)
    .transform((value) => Buffer.from(value, 'base64')),
  album: z
    .string({ error: 'Escreva o nome do álbum.' })
    .trim()
    .min(1, 'Escreva o nome do álbum.')
    .max(ALBUM_LIMIT, `O nome do álbum passou de ${ALBUM_LIMIT} caracteres.`)
    .transform((value) => value.replace(/\s+/g, ' ')),
  alt: z
    .string({ error: 'Descreva a foto para quem não a enxerga.' })
    .trim()
    .min(1, 'Descreva a foto para quem não a enxerga.')
    .max(ALT_LIMIT, `A descrição da foto passou de ${ALT_LIMIT} caracteres.`),
  caption: z
    .string({ error: 'A legenda precisa ser escrita em palavras.' })
    .trim()
    .max(CAPTION_LIMIT, `A legenda passou de ${CAPTION_LIMIT} caracteres.`)
    .nullish()
    .transform((value) => value || null),
  authorized: z.boolean({ error: 'Informe se a declaração de autorização foi marcada.' }).default(false),
});

export const publicationBody = z.object({ published: z.boolean({ error: 'Informe se a foto fica no ar.' }) });
