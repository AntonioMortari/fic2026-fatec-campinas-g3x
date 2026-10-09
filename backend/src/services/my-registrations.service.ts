import { Op } from 'sequelize';
import { Event, Registration } from '../models';
import { isOver } from './events.service';

export interface MyRegistration {
  id: string;
  name: string;
  registeredAt: string;
  attendanceRecorded: boolean;
  event: { id: string; title: string; startsAt: string; endsAt: string | null; location: string | null; isOver: boolean };
}

// Only the sign-ups tied to this account, filtered here: the database has no row-level security (CLAUDE.md, rule 4).
// "Did not come" is never sent back: it is the staff's working note, and "not checked" would read the same to the person.
export async function listMyRegistrations(userId: string, now: Date = new Date()): Promise<MyRegistration[]> {
  const rows = await Registration.findAll({
    where: { userId },
    attributes: ['id', 'eventId', 'name', 'attended', 'createdAt'],
    order: [['createdAt', 'ASC']],
  });
  if (rows.length === 0) return [];

  const events = await Event.findAll({ where: { id: { [Op.in]: [...new Set(rows.map((row) => row.eventId))] } } });
  const byId = new Map(events.map((event) => [event.id, event]));

  return rows
    .flatMap((row) => {
      const event = byId.get(row.eventId);
      if (!event) return [];
      return [
        {
          id: row.id,
          name: row.name,
          registeredAt: row.createdAt.toISOString(),
          attendanceRecorded: row.attended === true,
          event: {
            id: event.id,
            title: event.title,
            startsAt: event.startsAt.toISOString(),
            endsAt: event.endsAt ? event.endsAt.toISOString() : null,
            location: event.location,
            isOver: isOver(event, now),
          },
        },
      ];
    })
    .sort((a, b) => a.event.startsAt.localeCompare(b.event.startsAt) || a.registeredAt.localeCompare(b.registeredAt));
}
