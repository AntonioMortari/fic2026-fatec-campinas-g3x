import { Event } from '../models';
import { ApiError } from '../utils/api-error';
import { toPublicEvent, type PublicEvent } from './events.service';

export interface AdminEvent extends PublicEvent {
  requiresCpf: boolean;
  published: boolean;
  updatedAt: string;
}

export interface EventInput {
  title: string;
  description: string | null;
  category: string | null;
  startsAt: Date;
  endsAt: Date | null;
  location: string | null;
  ageRange: string | null;
  capacity: number | null;
  requiresCpf: boolean;
}

const notFound = () => new ApiError(404, 'event_not_found', 'Não encontramos esse evento.');

function toAdminEvent(event: Event): AdminEvent {
  return {
    ...toPublicEvent(event),
    requiresCpf: event.requiresCpf,
    published: event.published,
    updatedAt: event.updatedAt.toISOString(),
  };
}

// Every column is listed by hand: `published` is not among them, so saving can never publish.
function editableColumns(input: EventInput) {
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: input.location,
    ageRange: input.ageRange,
    capacity: input.capacity,
    requiresCpf: input.requiresCpf,
  };
}

export async function listAdminEvents(): Promise<AdminEvent[]> {
  const events = await Event.findAll({ order: [['startsAt', 'DESC']] });
  return events.map(toAdminEvent);
}

export async function getAdminEvent(id: string): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  return toAdminEvent(event);
}

export async function createEvent(input: EventInput): Promise<AdminEvent> {
  return toAdminEvent(await Event.create({ ...editableColumns(input), published: false }));
}

export async function updateEvent(id: string, input: EventInput): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  await event.update(editableColumns(input));
  return toAdminEvent(event);
}

export async function setEventPublished(id: string, published: boolean): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  await event.update({ published });
  return toAdminEvent(event);
}
