import { Op, col, fn, type Transaction, type WhereOptions } from 'sequelize';
import { Event, Registration } from '../models';

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
  spotsLeft: number | null;
}

export interface PublicEventDetail extends PublicEvent {
  requiresCpf: boolean;
  registrationsOpen: boolean;
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

export async function countRegistrations(eventIds: string[], transaction?: Transaction): Promise<Map<string, number>> {
  if (eventIds.length === 0) return new Map();
  const rows = (await Registration.findAll({
    attributes: ['eventId', [fn('COUNT', col('id')), 'total']],
    where: { eventId: { [Op.in]: eventIds }, cancelledAt: null },
    group: ['eventId'],
    raw: true,
    transaction,
  })) as unknown as { eventId: string; total: number | string }[];
  return new Map(rows.map((row) => [row.eventId, Number(row.total)]));
}

export const spotsLeft = (capacity: number | null, registered: number): number | null =>
  capacity === null ? null : Math.max(0, capacity - registered);

// An event is over when its end (or its start, with no end) is behind us: the same line the agenda draws between "Em breve" and "Já aconteceu".
export const isOver = (event: Pick<Event, 'startsAt' | 'endsAt'>, now: Date): boolean => (event.endsAt ?? event.startsAt) < now;

export function toPublicEvent(event: Event, registered = 0): PublicEvent {
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
    spotsLeft: spotsLeft(event.capacity, registered),
  };
}

export async function listPublishedEvents({ period, limit, now = new Date() }: ListEventsOptions): Promise<PublicEvent[]> {
  const events = await Event.findAll({
    where: { published: true, ...periodFilter(period, now) },
    order: [['startsAt', period === 'upcoming' ? 'ASC' : 'DESC']],
    ...(limit ? { limit } : {}),
  });
  const registered = await countRegistrations(events.map((event) => event.id));
  return events.map((event) => toPublicEvent(event, registered.get(event.id) ?? 0));
}

export async function getPublishedEventDetail(id: string, now: Date = new Date()): Promise<PublicEventDetail | null> {
  const event = await findPublishedEvent(id);
  if (!event) return null;
  const registered = (await countRegistrations([event.id])).get(event.id) ?? 0;
  const publicEvent = toPublicEvent(event, registered);
  return {
    ...publicEvent,
    requiresCpf: event.requiresCpf,
    registrationsOpen: !isOver(event, now) && publicEvent.spotsLeft !== 0,
  };
}

export async function findPublishedEvent(id: string): Promise<Event | null> {
  return Event.findOne({ where: { id, published: true } });
}
