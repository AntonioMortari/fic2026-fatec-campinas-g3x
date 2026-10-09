import { Registration } from '../models';
import { ApiError } from '../utils/api-error';
import { getAdminEvent, type AdminEvent } from './admin-events.service';

// Only what the person at the door needs: no e-mail, no CPF, no phone. A phone turned toward a queue must not show them.
export interface AttendanceEntry {
  id: string;
  name: string;
  isMinor: boolean;
  attended: boolean | null;
}

const toEntry = (row: Registration): AttendanceEntry => ({ id: row.id, name: row.name, isMinor: row.isMinor, attended: row.attended });

export async function listAttendance(eventId: string): Promise<{ event: AdminEvent; entries: AttendanceEntry[] }> {
  const event = await getAdminEvent(eventId);
  const rows = await Registration.findAll({
    where: { eventId },
    attributes: ['id', 'name', 'isMinor', 'attended'],
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
