import type { Request, Response } from 'express';
import type { z } from 'zod';
import { contactsCsv, getContact, listAllContacts, listContacts, countByStatus, triageContact } from '../services/admin-contacts.service';
import type { contactFilters, contactListQuery, triageBody } from '../validators/admin-contacts.validator';

export async function listAdminContacts(req: Request, res: Response): Promise<void> {
  const { status: filter, page, pageSize } = req.query as unknown as z.output<typeof contactListQuery>;
  res.json(await listContacts({ status: filter }, { page, pageSize }));
}

export async function getAdminContactCounts(_req: Request, res: Response): Promise<void> {
  res.json({ counts: await countByStatus() });
}

export async function getAdminContact(req: Request, res: Response): Promise<void> {
  res.json({ contact: await getContact(req.params.id as string) });
}

export async function triageAdminContact(req: Request, res: Response): Promise<void> {
  const { status: next, staffNote } = req.body as z.output<typeof triageBody>;
  res.json({ contact: await triageContact(req.params.id as string, { status: next, staffNote }) });
}

export async function downloadAdminContacts(req: Request, res: Response): Promise<void> {
  const contacts = await listAllContacts(req.query as z.output<typeof contactFilters>);
  res.type('text/csv; charset=utf-8').set('Content-Disposition', 'attachment; filename="mensagens.csv"').send(contactsCsv(contacts));
}
