import { Registration } from '../models';
import { toCsv } from '../utils/csv';
import { ORGANIZATION_TIME_ZONE } from '../utils/time-zone';
import { getAdminEvent, type AdminEvent } from './admin-events.service';

// What the staff may read about a sign-up. The account id and the origin hash stay in the database.
export interface AdminRegistration {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  isMinor: boolean;
  guardianName: string | null;
  guardianPhone: string | null;
  imageAuthorized: boolean;
  hasAccount: boolean;
  attended: boolean | null;
  createdAt: string;
}

export async function listRegistrations(eventId: string): Promise<{ event: AdminEvent; registrations: AdminRegistration[] }> {
  const event = await getAdminEvent(eventId);
  const rows = await Registration.findAll({ where: { eventId }, order: [['createdAt', 'ASC'], ['name', 'ASC']] });
  return {
    event,
    registrations: rows.map((row) => ({
      id: row.id,
      name: row.name,
      email: row.email,
      phone: row.phone,
      cpf: row.cpf,
      isMinor: row.isMinor,
      guardianName: row.guardianName,
      guardianPhone: row.guardianPhone,
      imageAuthorized: row.imageAuthorized,
      hasAccount: row.userId !== null,
      attended: row.attended,
      createdAt: row.createdAt.toISOString(),
    })),
  };
}

export function formatPhone(digits: string | null): string {
  const match = /^(\d{2})(\d{4,5})(\d{4})$/.exec(digits ?? '');
  return match ? `(${match[1]}) ${match[2]}-${match[3]}` : (digits ?? '');
}

export const formatCpf = (digits: string | null): string => (digits ? digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4') : '');

function formatDateTime(iso: string): string {
  const parts = new Intl.DateTimeFormat('pt-BR', {
    timeZone: ORGANIZATION_TIME_ZONE,
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(new Date(iso));
  const part = (type: string) => parts.find((entry) => entry.type === type)?.value ?? '';
  return `${part('day')}/${part('month')}/${part('year')} ${part('hour')}:${part('minute')}`;
}

// The image column comes before the contact ones: on a wide sheet, what sits to the right is what nobody scrolls to,
// and it is the column that decides whether a person may appear in a photo (RN07).
export function registrationsCsv(registrations: AdminRegistration[]): string {
  const header = ['Nome', 'Autorizou imagem', 'Menor de idade', 'Responsável', 'Telefone do responsável', 'E-mail', 'Telefone', 'CPF', 'Tem conta', 'Inscrito em', 'Presença'];
  const rows = registrations.map((registration) => [
    registration.name,
    registration.imageAuthorized ? 'Sim' : 'Não',
    registration.isMinor ? 'Sim' : 'Não',
    registration.guardianName,
    formatPhone(registration.guardianPhone),
    registration.email,
    formatPhone(registration.phone),
    formatCpf(registration.cpf),
    registration.hasAccount ? 'Sim' : 'Não',
    formatDateTime(registration.createdAt),
    registration.attended === null ? 'Não conferido' : registration.attended ? 'Veio' : 'Faltou',
  ]);
  return toCsv([header, ...rows]);
}
