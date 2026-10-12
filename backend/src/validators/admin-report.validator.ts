import { z } from 'zod';

// A query string is text: the offset is read as a whole number no bigger than zero (the future has nothing to report).
export const reportQuery = z.object({
  period: z.enum(['month', 'quarter', 'semester'], { error: 'Escolha mês, trimestre ou semestre.' }).default('month'),
  offset: z.coerce.number({ error: 'Período inválido.' }).int('Período inválido.').min(-240, 'Período inválido.').max(0, 'Ainda não há o que relatar no futuro.').default(0),
});
