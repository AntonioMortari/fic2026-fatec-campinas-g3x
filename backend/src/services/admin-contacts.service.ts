import { col, fn, literal, type WhereOptions } from 'sequelize';
import { Contact, type ContactStatus } from '../models';
import { ApiError } from '../utils/api-error';
import { CONTACT_STATUS_LABELS } from '../utils/contact-status';
import { toCsv } from '../utils/csv';
import { formatDateTime, formatPhone } from './admin-registrations.service';

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export interface AdminContact {
  id: string;
  status: ContactStatus;
  name: string;
  email: string;
  phone: string | null;
  institution: string | null;
  message: string;
  staffNote: string | null;
  createdAt: string;
}

export type ContactCounts = Record<ContactStatus, number> & { all: number };

export interface ContactFilters {
  status?: ContactStatus;
}

export interface ContactPage {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface ContactTriage {
  status?: ContactStatus;
  staffNote?: string | null;
}

const notFound = () => new ApiError(404, 'contact_not_found', 'Não encontramos essa mensagem.');

const QUEUE_ORDER: [ReturnType<typeof literal>, string][] = [[literal("FIELD(`status`, 'new', 'in_contact', 'done')"), 'ASC']];


const ATTRIBUTES = ['id', 'status', 'name', 'email', 'phone', 'institution', 'message', 'staffNote', 'createdAt'];

function toAdmin(row: Contact): AdminContact {
  return {
    id: row.id,
    status: row.status,
    name: row.name,
    email: row.email,
    phone: row.phone,
    institution: row.institution,
    message: row.message,
    staffNote: row.staffNote,
    createdAt: row.createdAt.toISOString(),
  };
}

function whereFor(filters: ContactFilters): WhereOptions<Contact> {
  return filters.status ? { status: filters.status } : {};
}

export async function countByStatus(): Promise<ContactCounts> {
  const rows = (await Contact.findAll({
    attributes: ['status', [fn('COUNT', col('id')), 'total']],
    group: ['status'],
    raw: true,
  })) as unknown as { status: ContactStatus; total: number | string }[];

  const counts: ContactCounts = { all: 0, new: 0, in_contact: 0, done: 0 };
  for (const row of rows) {
    counts[row.status] = Number(row.total);
    counts.all += Number(row.total);
  }
  return counts;
}

export async function listContacts(
  filters: ContactFilters = {},
  { page = 1, pageSize = DEFAULT_PAGE_SIZE }: { page?: number; pageSize?: number } = {},
): Promise<{ data: AdminContact[]; counts: ContactCounts; pagination: ContactPage }> {
  const counts = await countByStatus();
  const total = filters.status ? counts[filters.status] : counts.all;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const rows = await Contact.findAll({
    attributes: ATTRIBUTES,
    where: whereFor(filters),
    order: [...QUEUE_ORDER, ['createdAt', 'DESC'], ['id', 'ASC']],
    limit: pageSize,
    offset: (page - 1) * pageSize,
  });
  return { data: rows.map(toAdmin), counts, pagination: { page, pageSize, total, totalPages } };
}

export async function listAllContacts(filters: ContactFilters = {}): Promise<AdminContact[]> {
  const rows = await Contact.findAll({
    attributes: ATTRIBUTES,
    where: whereFor(filters),
    order: [...QUEUE_ORDER, ['createdAt', 'DESC'], ['id', 'ASC']],
  });
  return rows.map(toAdmin);
}

export async function getContact(id: string): Promise<AdminContact> {
  const row = await Contact.findByPk(id, { attributes: ATTRIBUTES });
  if (!row) throw notFound();
  return toAdmin(row);
}

export async function triageContact(id: string, changes: ContactTriage): Promise<AdminContact> {
  const row = await Contact.findByPk(id, { attributes: ATTRIBUTES });
  if (!row) throw notFound();
  const values: ContactTriage = {};
  if (changes.status !== undefined) values.status = changes.status;
  if (changes.staffNote !== undefined) values.staffNote = changes.staffNote;
  await row.update(values, { fields: ['status', 'staffNote'] });
  return toAdmin(row);
}

export function contactsCsv(contacts: AdminContact[]): string {
  const header = ['Nome', 'Situação', 'Instituição', 'E-mail', 'Telefone', 'Mensagem', 'Nota interna', 'Recebida em'];
  const rows = contacts.map((contact) => [
    contact.name,
    CONTACT_STATUS_LABELS[contact.status],
    contact.institution,
    contact.email,
    formatPhone(contact.phone),
    contact.message,
    contact.staffNote,
    formatDateTime(contact.createdAt),
  ]);
  return toCsv([header, ...rows]);
}
