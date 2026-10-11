import type { Request, Response } from 'express';
import { z } from 'zod';
import { CONTACT_STATUSES } from '../models';
import { contactsCsv, DEFAULT_PAGE_SIZE, getContact, listAllContacts, listContacts, MAX_PAGE_SIZE, countByStatus, triageContact } from '../services/admin-contacts.service';

export const STAFF_NOTE_LIMIT = 2000;

const status = z.enum(CONTACT_STATUSES, { error: 'Situação inválida.' });

export const contactParams = z.object({ id: z.uuid('Mensagem inválida.') });

export const contactFilters = z.object({ status: status.optional() });

export const contactListQuery = z.object({
  status: status.optional(),
  page: z.coerce.number({ error: 'Página inválida.' }).int('Página inválida.').min(1, 'Página inválida.').default(1),
  pageSize: z.coerce
    .number({ error: 'Tamanho de página inválido.' })
    .int('Tamanho de página inválido.')
    .min(1, 'Tamanho de página inválido.')
    .max(MAX_PAGE_SIZE, `Peça no máximo ${MAX_PAGE_SIZE} por página.`)
    .default(DEFAULT_PAGE_SIZE),
});

export const triageBody = z
  .object({
    status: z.enum(CONTACT_STATUSES, { error: 'Escolha uma das três situações.' }).optional(),
    staffNote: z
      .string({ error: 'A nota precisa ser escrita em palavras.' })
      .trim()
      .max(STAFF_NOTE_LIMIT, `A nota passou de ${STAFF_NOTE_LIMIT} caracteres.`)
      .nullable()
      .optional()
      .transform((value) => (value === undefined ? undefined : value || null)),
  })
  .refine((body) => body.status !== undefined || body.staffNote !== undefined, { message: 'Envie a situação ou a nota interna.' });

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
