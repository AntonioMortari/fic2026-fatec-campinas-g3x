import { fn, col, Op, UniqueConstraintError, type WhereOptions } from 'sequelize';
import { sequelize, User, VolunteerApplication, VolunteerApplicationArea, VolunteerArea, type VolunteerStatus } from '../models';
import { ApiError } from '../utils/api-error';
import { toCsv } from '../utils/csv';
import { STAFF_STATUS_LABELS, STATUS_QUEUE_RANK } from '../utils/volunteer-status';
import { formatDateTime, formatPhone } from './admin-registrations.service';
import { toApplicationAreas, type ApplicationArea } from './volunteer.service';

export interface AdminVolunteerApplication {
  id: string;
  status: VolunteerStatus;
  message: string | null;
  createdAt: string;
  updatedAt: string;
  name: string;
  email: string;
  phone: string | null;
  areas: ApplicationArea[];
}

export type StatusCounts = Record<VolunteerStatus, number> & { all: number };

export interface ApplicationFilters {
  status?: VolunteerStatus;
  area?: string;
}

const notFound = () => new ApiError(404, 'application_not_found', 'Não encontramos essa candidatura.');

const INCLUDES = [
  { model: User, as: 'user', attributes: ['name', 'email', 'phone'] },
  { model: VolunteerArea, as: 'areas', attributes: ['id', 'name', 'sortOrder'], through: { attributes: [] } },
];

function toAdmin(row: VolunteerApplication): AdminVolunteerApplication {
  return {
    id: row.id,
    status: row.status,
    message: row.message,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    name: row.user?.name ?? '',
    email: row.user?.email ?? '',
    phone: row.user?.phone ?? null,
    areas: toApplicationAreas(row.areas),
  };
}

async function inArea(area: string | undefined): Promise<WhereOptions<VolunteerApplication>> {
  if (!area) return {};
  const links = await VolunteerApplicationArea.findAll({ where: { areaId: area }, attributes: ['applicationId'] });
  return { id: { [Op.in]: links.map((link) => link.applicationId) } };
}

export async function countByStatus(area?: string): Promise<StatusCounts> {
  const rows = (await VolunteerApplication.findAll({
    where: await inArea(area),
    attributes: ['status', [fn('COUNT', col('id')), 'total']],
    group: ['status'],
    raw: true,
  })) as unknown as { status: VolunteerStatus; total: number | string }[];

  const counts: StatusCounts = { all: 0, new: 0, in_contact: 0, volunteering: 0, ended: 0 };
  for (const row of rows) {
    counts[row.status] = Number(row.total);
    counts.all += Number(row.total);
  }
  return counts;
}

export async function listApplications(filters: ApplicationFilters = {}): Promise<{ data: AdminVolunteerApplication[]; counts: StatusCounts }> {
  const byArea = await inArea(filters.area);
  const counts = await countByStatus(filters.area);
  const rows = await VolunteerApplication.findAll({
    where: { ...byArea, ...(filters.status ? { status: filters.status } : {}) },
    include: INCLUDES,
    order: [['createdAt', 'DESC']],
  });
  const data = rows.map(toAdmin).sort((a, b) => STATUS_QUEUE_RANK[a.status] - STATUS_QUEUE_RANK[b.status] || b.createdAt.localeCompare(a.createdAt));
  return { data, counts };
}

export async function getApplication(id: string): Promise<AdminVolunteerApplication> {
  const row = await VolunteerApplication.findByPk(id, { include: INCLUDES });
  if (!row) throw notFound();
  return toAdmin(row);
}

export async function setApplicationStatus(id: string, status: VolunteerStatus): Promise<AdminVolunteerApplication> {
  try {
    await sequelize.transaction(async (transaction) => {
      const row = await VolunteerApplication.findByPk(id, { transaction, lock: transaction.LOCK.UPDATE });
      if (!row) throw notFound();
      await row.update({ status }, { fields: ['status'], transaction });
    });
  } catch (error) {
    if (error instanceof UniqueConstraintError) {
      throw new ApiError(409, 'live_application_exists', 'Esta pessoa já tem outra candidatura em andamento. Encerre uma das duas antes.');
    }
    throw error;
  }
  return getApplication(id);
}

export function applicationsCsv(applications: AdminVolunteerApplication[]): string {
  const header = ['Nome', 'Situação', 'Áreas', 'E-mail', 'Telefone', 'Mensagem', 'Candidatou-se em'];
  const rows = applications.map((application) => [
    application.name,
    STAFF_STATUS_LABELS[application.status],
    application.areas.map((area) => area.name).join(', '),
    application.email,
    formatPhone(application.phone),
    application.message,
    formatDateTime(application.createdAt),
  ]);
  return toCsv([header, ...rows]);
}
