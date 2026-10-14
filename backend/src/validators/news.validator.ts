import { z } from 'zod';

export const newsParams = z.object({ id: z.uuid('Notícia inválida.') });
