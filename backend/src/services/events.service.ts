import { Op, col, fn, type Transaction, type WhereOptions } from 'sequelize';
import { Event, Registration } from '../models';

export type EventPeriod = 'upcoming' | 'past';

export type RegistrationStatus = 'open' | 'few_left' | 'full' | 'not_on_site' | 'started' | 'unknown';

export const FEW_SPOTS_THRESHOLD = 3;

export interface EventImage {
  url: string;
  alt: string;
}

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
  registrationOnSite: boolean;
  registrationStatus: RegistrationStatus;
  image: EventImage | null;
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

function periodFilter(period: EventPeriod, now: Date): WhereOptions {
  return period === 'upcoming' ? { startsAt: { [Op.gt]: now } } : { startsAt: { [Op.lte]: now } };
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

export async function countRegistrationsOrNull(eventIds: string[]): Promise<Map<string, number> | null> {
  try {
    return await countRegistrations(eventIds);
  } catch (error) {
    console.error('[events] could not count registrations', error);
    return null;
  }
}

export const spotsLeft = (capacity: number | null, registered: number | null): number | null =>
  capacity === null || registered === null ? null : Math.max(0, capacity - registered);

export const hasStarted = (event: Pick<Event, 'startsAt'>, now: Date): boolean => now >= event.startsAt;

export function registrationStatus(
  event: Pick<Event, 'startsAt' | 'registrationOnSite' | 'capacity'>,
  registered: number | null,
  now: Date,
): RegistrationStatus {
  if (hasStarted(event, now)) return 'started';
  if (!event.registrationOnSite) return 'not_on_site';
  if (event.capacity === null) return 'open';
  if (registered === null) return 'unknown';
  const left = event.capacity - registered;
  if (left <= 0) return 'full';
  return left <= FEW_SPOTS_THRESHOLD ? 'few_left' : 'open';
}

export const eventImageUrl = (event: Pick<Event, 'id' | 'imageUpdatedAt'>): string =>
  `/api/events/${event.id}/image?v=${event.imageUpdatedAt?.getTime() ?? 0}`;

export function publicImage(event: Pick<Event, 'id' | 'imageUpdatedAt' | 'imageAlt'>): EventImage | null {
  return event.imageUpdatedAt && event.imageAlt ? { url: eventImageUrl(event), alt: event.imageAlt } : null;
}

export const isOver = (event: Pick<Event, 'startsAt' | 'endsAt'>, now: Date): boolean => (event.endsAt ?? event.startsAt) < now;

export function toPublicEvent(event: Event, registered: number | null = 0, now: Date = new Date()): PublicEvent {
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
    registrationOnSite: event.registrationOnSite,
    registrationStatus: registrationStatus(event, registered, now),
    image: publicImage(event),
  };
}

export async function listPublishedEvents({ period, limit, now = new Date() }: ListEventsOptions): Promise<PublicEvent[]> {
  const events = await Event.findAll({
    where: { published: true, ...periodFilter(period, now) },
    order: [['startsAt', period === 'upcoming' ? 'ASC' : 'DESC']],
    ...(limit ? { limit } : {}),
  });
  const registered = await countRegistrationsOrNull(events.map((event) => event.id));
  return events.map((event) => toPublicEvent(event, registered ? (registered.get(event.id) ?? 0) : null, now));
}

export async function getPublishedEventDetail(id: string, now: Date = new Date()): Promise<PublicEventDetail | null> {
  const event = await findPublishedEvent(id);
  if (!event) return null;
  const counts = await countRegistrationsOrNull([event.id]);
  const publicEvent = toPublicEvent(event, counts ? (counts.get(event.id) ?? 0) : null, now);
  return {
    ...publicEvent,
    requiresCpf: event.requiresCpf,
    registrationsOpen: ['open', 'few_left', 'unknown'].includes(publicEvent.registrationStatus),
  };
}

export async function findPublishedEvent(id: string): Promise<Event | null> {
  return Event.findOne({ where: { id, published: true } });
}

export async function findPublishedEventImage(id: string): Promise<Event | null> {
  const event = await Event.findOne({
    attributes: ['id', 'imageFile', 'imageMime', 'imageUpdatedAt'],
    where: { id, published: true },
  });
  return event?.imageFile ? event : null;
}
