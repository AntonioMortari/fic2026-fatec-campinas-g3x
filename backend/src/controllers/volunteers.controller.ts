import type { Request, Response } from 'express';
import type { z } from 'zod';
import { applicationsCsv, countByStatus, getApplication, listApplications, setApplicationStatus } from '../services/admin-volunteers.service';
import { applyToVolunteer, listMyApplications, listVolunteerAreas, type VolunteerApplicationInput } from '../services/volunteer.service';
import { ApiError } from '../utils/api-error';
import type { applicationFilters, areaFilter, statusBody } from '../validators/volunteers.validator';

function requireUser(req: Request): string {
  if (!req.user) throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  return req.user.id;
}

export async function getAreas(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listVolunteerAreas() });
}

export async function apply(req: Request, res: Response): Promise<void> {
  const { areas, message } = req.body as VolunteerApplicationInput;
  res.status(201).json({ application: await applyToVolunteer(requireUser(req), { areas, message }) });
}

export async function getMyApplications(req: Request, res: Response): Promise<void> {
  res.json({ data: await listMyApplications(requireUser(req)) });
}

export async function listAdminApplications(req: Request, res: Response): Promise<void> {
  res.json(await listApplications(req.query as z.output<typeof applicationFilters>));
}

export async function getAdminCounts(req: Request, res: Response): Promise<void> {
  res.json({ counts: await countByStatus((req.query as z.output<typeof areaFilter>).area) });
}

export async function getAdminApplication(req: Request, res: Response): Promise<void> {
  res.json({ application: await getApplication(req.params.id as string) });
}

export async function setAdminApplicationStatus(req: Request, res: Response): Promise<void> {
  const { status } = req.body as z.output<typeof statusBody>;
  res.json({ application: await setApplicationStatus(req.params.id as string, status) });
}

export async function downloadAdminApplications(req: Request, res: Response): Promise<void> {
  const { data } = await listApplications(req.query as z.output<typeof applicationFilters>);
  res.type('text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="voluntarios.csv"').send(applicationsCsv(data));
}
