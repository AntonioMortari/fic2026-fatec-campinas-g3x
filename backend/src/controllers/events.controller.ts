import type { Request, Response } from 'express';
import { z } from 'zod';
import { findPublishedEvent, listPublishedEvents } from '../services/events.service';
import { ApiError } from '../utils/api-error';
import { buildIcs, icsFileName } from '../utils/ics';

export const listEventsQuery = z.object({
  period: z.enum(['upcoming', 'past']).default('upcoming'),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});

export const eventParams = z.object({ id: z.uuid() });

export async function listEvents(req: Request, res: Response): Promise<void> {
  const { period, limit } = req.query as unknown as z.infer<typeof listEventsQuery>;
  const data = await listPublishedEvents({ period, limit });
  res.json({ data });
}

export async function downloadEventCalendar(req: Request, res: Response): Promise<void> {
  const event = await findPublishedEvent(req.params.id as string);
  if (!event) throw new ApiError(404, 'event_not_found', 'Não encontramos essa atividade.');

  res
    .type('text/calendar; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="${icsFileName(event.title)}"`)
    .send(buildIcs(event));
}
