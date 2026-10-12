import type { Request, Response } from 'express';
import type { z } from 'zod';
import {
  createEvent,
  getAdminEvent,
  findEventImageForStaff,
  listAdminEvents,
  removeEventImage,
  setEventImage,
  setEventPublished,
  updateEvent,
  type EventInput,
} from '../services/admin-events.service';
import { listAttendance, setAttendance } from '../services/attendance.service';
import { listRegistrations, registrationsCsv } from '../services/admin-registrations.service';
import { slugify } from '../utils/ics';
import { sendEventImage } from './events.controller';
import type { attendanceBody, imageBody, publicationBody } from '../validators/admin-events.validator';

export async function listEvents(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listAdminEvents() });
}

export async function getEvent(req: Request, res: Response): Promise<void> {
  res.json({ event: await getAdminEvent(req.params.id as string) });
}

export async function create(req: Request, res: Response): Promise<void> {
  res.status(201).json({ event: await createEvent(req.body as EventInput) });
}

export async function update(req: Request, res: Response): Promise<void> {
  res.json({ event: await updateEvent(req.params.id as string, req.body as EventInput) });
}

export async function setPublication(req: Request, res: Response): Promise<void> {
  const { published } = req.body as z.output<typeof publicationBody>;
  res.json({ event: await setEventPublished(req.params.id as string, published) });
}

export async function getRegistrations(req: Request, res: Response): Promise<void> {
  const { event, registrations } = await listRegistrations(req.params.id as string);
  res.json({ event, data: registrations });
}

export async function downloadRegistrations(req: Request, res: Response): Promise<void> {
  const { event, registrations } = await listRegistrations(req.params.id as string);
  res
    .type('text/csv; charset=utf-8')
    .set('Content-Disposition', `attachment; filename="inscritos-${slugify(event.title) || 'evento'}.csv"`)
    .send(registrationsCsv(registrations));
}

export async function getAttendance(req: Request, res: Response): Promise<void> {
  const { event, entries } = await listAttendance(req.params.id as string);
  res.json({ event, data: entries });
}

export async function markAttendance(req: Request, res: Response): Promise<void> {
  const { attended } = req.body as z.output<typeof attendanceBody>;
  res.json({ registration: await setAttendance(req.params.id as string, req.params.registrationId as string, attended) });
}

export async function putImage(req: Request, res: Response): Promise<void> {
  const { data, alt } = req.body as z.output<typeof imageBody>;
  res.json({ event: await setEventImage(req.params.id as string, { data, alt }) });
}

export async function deleteImage(req: Request, res: Response): Promise<void> {
  res.json({ event: await removeEventImage(req.params.id as string) });
}

export async function getImage(req: Request, res: Response): Promise<void> {
  await sendEventImage(res, await findEventImageForStaff(req.params.id as string), 'private, no-store');
}
