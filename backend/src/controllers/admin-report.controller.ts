import type { Request, Response } from 'express';
import type { z } from 'zod';
import { buildReport, reportCsv } from '../services/report.service';
import { slugify } from '../utils/ics';
import type { reportQuery } from '../validators/admin-report.validator';

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
