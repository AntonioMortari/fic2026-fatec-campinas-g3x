import { z } from 'zod';

export const cancelParams = z.object({ code: z.uuid('Link inválido.') });
