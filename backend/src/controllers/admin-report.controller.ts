import type { Request, Response } from 'express';
import { z } from 'zod';
import { buildReport, reportCsv } from '../services/report.service';
import { slugify } from '../utils/ics';

// A query string is text: the offset is read as a whole number no bigger than zero (the future has nothing to report).
export const reportQuery = z.object({
  period: z.enum(['month', 'quarter', 'semester'], { error: 'Escolha mês, trimestre ou semestre.' }).default('month'),
  offset: z.coerce.number({ error: 'Período inválido.' }).int('Período inválido.').min(-240, 'Período inválido.').max(0, 'Ainda não há o que relatar no futuro.').default(0),
});

export async function getReport(req: Request, res: Response): Promise<void> {
  const { period, offset } = req.query as unknown as z.output<typeof reportQuery>;
  res.json((await buildReport(period, offset)).report);
}

export async function downloadReport(req: Request, res: Response): Promise<void> {
  const { period, offset } = req.query as unknown as z.output<typeof reportQuery>;
  const { report, all } = await buildReport(period, offset);
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="relatorio-${slugify(report.label) || 'periodo'}.csv"`)
    .send(reportCsv(report, all));
}
