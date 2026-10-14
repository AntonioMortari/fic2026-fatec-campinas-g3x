import { z } from 'zod';

export const galleryParams = z.object({ id: z.uuid('Foto inválida.') });
