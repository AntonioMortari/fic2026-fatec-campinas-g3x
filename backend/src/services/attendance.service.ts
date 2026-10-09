import { Registration } from '../models';
import { ApiError } from '../utils/api-error';
import { getAdminEvent, type AdminEvent } from './admin-events.service';

// Only what the person at the door needs: no e-mail, no CPF, no whole phone. A phone turned toward a queue must not
// show them. The guardian's number comes masked, enough to tell which family is at the door.
export interface AttendanceEntry {
  id: string;
  name: string;
  isMinor: boolean;
  guardianPhoneHint: string | null;
  attended: boolean | null;
}

export function maskPhone(digits: string | null): string | null {
  const match = /^(\d{2})(\d)(\d{3,4})(\d{4})$/.exec(digits ?? '');
  return match ? `(${match[1]}) ${match[2]}····-${match[4]}` : null;
}

const toEntry = (row: Registration): AttendanceEntry => ({
  id: row.id,
  name: row.name,
  isMinor: row.isMinor,
  guardianPhoneHint: row.isMinor ? maskPhone(row.guardianPhone) : null,
  attended: row.attended,
});

export async function listAttendance(eventId: string): Promise<{ event: AdminEvent; entries: AttendanceEntry[] }> {
  const event = await getAdminEvent(eventId);
  const rows = await Registration.findAll({
    where: { eventId },
    attributes: ['id', 'name', 'isMinor', 'guardianPhone', 'attended'],
    order: [['name', 'ASC'], ['createdAt', 'ASC']],
  });
  return { event, entries: rows.map(toEntry) };
}

// The registration must belong to the event in the URL: an id from another event is "not found", not an update.
export async function setAttendance(eventId: string, registrationId: string, attended: boolean | null): Promise<AttendanceEntry> {
  const row = await Registration.findOne({ where: { id: registrationId, eventId } });
  if (!row) throw new ApiError(404, 'registration_not_found', 'Não encontramos essa inscrição neste evento.');
  await row.update({ attended });
  return toEntry(row);
}
