import type { Request, Response } from 'express';
import type { z } from 'zod';
import type { Event } from '../models';
import { findPublishedEvent, findPublishedEventImage, getPublishedEventDetail, listPublishedEvents } from '../services/events.service';
import { registerForEvent, type RegistrationInput } from '../services/registration.service';
import { ApiError } from '../utils/api-error';
import { isStoredName, uploadsDir } from '../utils/event-image-storage';
import { buildIcs, icsFileName } from '../utils/ics';
import { originHash } from '../utils/origin';
import type { listEventsQuery, registrationBody } from '../validators/events.validator';

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

export async function getEvent(req: Request, res: Response): Promise<void> {
  const event = await getPublishedEventDetail(req.params.id as string);
  if (!event) throw new ApiError(404, 'event_not_found', 'Não encontramos essa atividade.');
  res.json({ event });
}

export async function createRegistration(req: Request, res: Response): Promise<void> {
  const { consent: _consent, ...input } = req.body as z.output<typeof registrationBody>;
  const result = await registerForEvent(req.params.id as string, input as RegistrationInput, req.user?.id ?? null, originHash(req));
  res.status(201).json(result);
}

export function sendEventImage(res: Response, event: Event, cacheControl: string): Promise<void> {
  const name = event.imageFile;
  if (!isStoredName(name)) throw new ApiError(404, 'image_not_found', 'Esta atividade não tem foto.');
  res.set({
    'Content-Type': event.imageMime as string,
    'X-Content-Type-Options': 'nosniff',
    'Content-Disposition': 'inline',
    'Cross-Origin-Resource-Policy': 'cross-origin',
    'Cache-Control': cacheControl,
    ETag: `"${event.imageUpdatedAt?.getTime() ?? 0}"`,
  });
  return new Promise((resolve, reject) => {
    res.sendFile(name, { root: uploadsDir(), dotfiles: 'deny', etag: false, lastModified: false, cacheControl: false }, (error) => {
      if (!error) return resolve();
      if (res.headersSent) return resolve();
      for (const header of ['Content-Type', 'Content-Disposition', 'Cache-Control', 'ETag']) res.removeHeader(header);
      reject(new ApiError(404, 'image_not_found', 'Esta atividade não tem foto.'));
    });
  });
}

export async function getEventImage(req: Request, res: Response): Promise<void> {
  const event = await findPublishedEventImage(req.params.id as string);
  if (!event) throw new ApiError(404, 'image_not_found', 'Esta atividade não tem foto.');
  await sendEventImage(res, event, 'public, max-age=3600');
}
