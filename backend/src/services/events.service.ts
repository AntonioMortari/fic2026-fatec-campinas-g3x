import { Op, type WhereOptions } from 'sequelize';
import { Event } from '../models';

export type EventPeriod = 'upcoming' | 'past';

export interface PublicEvent {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  startsAt: string;
  endsAt: string | null;
  location: string | null;
  ageRange: string | null;
  capacity: number | null;
}

export interface ListEventsOptions {
  period: EventPeriod;
  limit?: number;
  now?: Date;
}

// Spelled out for both periods instead of NOT(...): with a NULL ends_at the negation evaluates to NULL and drops the row.
function periodFilter(period: EventPeriod, now: Date): WhereOptions {
  if (period === 'upcoming') {
    return { [Op.or]: [{ endsAt: { [Op.gte]: now } }, { endsAt: null, startsAt: { [Op.gte]: now } }] };
  }
  return { [Op.or]: [{ endsAt: { [Op.lt]: now } }, { endsAt: null, startsAt: { [Op.lt]: now } }] };
}

export function toPublicEvent(event: Event): PublicEvent {
  return {
    id: event.id,
    title: event.title,
    description: event.description,
    category: event.category,
    startsAt: event.startsAt.toISOString(),
    endsAt: event.endsAt?.toISOString() ?? null,
    location: event.location,
    ageRange: event.ageRange,
    capacity: event.capacity,
  };
}

export async function listPublishedEvents({ period, limit, now = new Date() }: ListEventsOptions): Promise<PublicEvent[]> {
  const events = await Event.findAll({
    where: { published: true, ...periodFilter(period, now) },
    order: [['startsAt', period === 'upcoming' ? 'ASC' : 'DESC']],
    ...(limit ? { limit } : {}),
  });
  return events.map(toPublicEvent);
}

export async function findPublishedEvent(id: string): Promise<Event | null> {
  return Event.findOne({ where: { id, published: true } });
}
