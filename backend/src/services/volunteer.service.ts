import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize, User, VolunteerApplication, VolunteerApplicationArea, VolunteerArea, type VolunteerStatus } from '../models';
import { ApiError } from '../utils/api-error';

export interface PublicVolunteerArea {
  id: string;
  name: string;
  description: string;
}

export interface ApplicationArea {
  id: string;
  name: string;
}

export interface MyVolunteerApplication {
  id: string;
  status: VolunteerStatus;
  message: string | null;
  createdAt: string;
  areas: ApplicationArea[];
}

export interface VolunteerApplicationInput {
  areas: string[];
  message: string | null;
}

const fieldError = (field: string, message: string) => new ApiError(400, 'invalid_data', 'Confira os dados enviados.', [{ location: 'body', field, message }]);
const alreadyApplied = () => new ApiError(409, 'already_applied', 'Você já tem uma candidatura em andamento.');

export function byAreaOrder(a: VolunteerArea, b: VolunteerArea): number {
  return a.sortOrder - b.sortOrder;
}

export function toApplicationAreas(areas: VolunteerArea[] | undefined): ApplicationArea[] {
  return [...(areas ?? [])].sort(byAreaOrder).map((area) => ({ id: area.id, name: area.name }));
}

export async function listVolunteerAreas(): Promise<PublicVolunteerArea[]> {
  const areas = await VolunteerArea.findAll({ order: [['sortOrder', 'ASC']] });
  return areas.map((area) => ({ id: area.id, name: area.name, description: area.description }));
}

function toMine(application: VolunteerApplication, areas: VolunteerArea[] | undefined): MyVolunteerApplication {
  return {
    id: application.id,
    status: application.status,
    message: application.message,
    createdAt: application.createdAt.toISOString(),
    areas: toApplicationAreas(areas),
  };
}

export async function applyToVolunteer(userId: string, input: VolunteerApplicationInput): Promise<MyVolunteerApplication> {
  if (!(await User.count({ where: { id: userId } }))) {
    throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  }

  const areas = await VolunteerArea.findAll({ where: { id: { [Op.in]: input.areas } } });
  if (areas.length !== input.areas.length) throw fieldError('areas', 'Escolha só entre as áreas da lista.');

  try {
    const application = await sequelize.transaction(async (transaction) => {
      const alive = await VolunteerApplication.findOne({ where: { userId, status: { [Op.ne]: 'ended' } }, transaction });
      if (alive) throw alreadyApplied();

      const created = await VolunteerApplication.create({ userId, status: 'new', message: input.message }, { transaction });
      await VolunteerApplicationArea.bulkCreate(
        areas.map((area) => ({ applicationId: created.id, areaId: area.id })),
        { transaction },
      );
      return created;
    });
    return toMine(application, areas);
  } catch (error) {
    if (error instanceof UniqueConstraintError) throw alreadyApplied();
    throw error;
  }
}

export async function listMyApplications(userId: string): Promise<MyVolunteerApplication[]> {
  const rows = await VolunteerApplication.findAll({
    where: { userId },
    include: [{ model: VolunteerArea, as: 'areas', attributes: ['id', 'name', 'sortOrder'], through: { attributes: [] } }],
    order: [['createdAt', 'DESC']],
  });
  return rows
    .map((row) => toMine(row, row.areas))
    .sort((a, b) => Number(a.status === 'ended') - Number(b.status === 'ended') || b.createdAt.localeCompare(a.createdAt));
}
