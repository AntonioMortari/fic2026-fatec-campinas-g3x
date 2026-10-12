import { Event } from '../models';
import { ApiError } from '../utils/api-error';
import { detectImageMime } from '../utils/image-signature';
import { countRegistrations, toPublicEvent, type EventImage, type PublicEvent } from './events.service';

export const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export interface AdminEvent extends PublicEvent {
  requiresCpf: boolean;
  published: boolean;
  registrationCount: number;
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
  registrationOnSite: boolean;
}

export interface ImageInput {
  data: Buffer;
  alt: string;
}

const notFound = () => new ApiError(404, 'event_not_found', 'Não encontramos esse evento.');

function adminImage(event: Event): EventImage | null {
  return event.imageUpdatedAt && event.imageAlt
    ? { url: `/api/admin/events/${event.id}/image?v=${event.imageUpdatedAt.getTime()}`, alt: event.imageAlt }
    : null;
}

function toAdminEvent(event: Event, registered = 0): AdminEvent {
  return {
    ...toPublicEvent(event, registered),
    image: adminImage(event),
    requiresCpf: event.requiresCpf,
    published: event.published,
    registrationCount: registered,
    updatedAt: event.updatedAt.toISOString(),
  };
}

function editableColumns(input: EventInput) {
  const onSite = input.registrationOnSite;
  return {
    title: input.title,
    description: input.description,
    category: input.category,
    startsAt: input.startsAt,
    endsAt: input.endsAt,
    location: input.location,
    ageRange: input.ageRange,
    capacity: onSite ? input.capacity : null,
    requiresCpf: onSite ? input.requiresCpf : false,
    registrationOnSite: onSite,
  };
}

export async function listAdminEvents(): Promise<AdminEvent[]> {
  const events = await Event.findAll({ order: [['startsAt', 'DESC']] });
  const registered = await countRegistrations(events.map((event) => event.id));
  return events.map((event) => toAdminEvent(event, registered.get(event.id) ?? 0));
}

export async function getAdminEvent(id: string): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  return toAdminEvent(event, (await countRegistrations([id])).get(id) ?? 0);
}

export async function createEvent(input: EventInput): Promise<AdminEvent> {
  return toAdminEvent(await Event.create({ ...editableColumns(input), published: false }));
}

export async function updateEvent(id: string, input: EventInput): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  await event.update(editableColumns(input));
  return toAdminEvent(event, (await countRegistrations([id])).get(id) ?? 0);
}

export async function setEventPublished(id: string, published: boolean): Promise<AdminEvent> {
  const event = await Event.findByPk(id);
  if (!event) throw notFound();
  await event.update({ published });
  return toAdminEvent(event, (await countRegistrations([id])).get(id) ?? 0);
}

const imageError = (status: number, code: string, message: string) =>
  new ApiError(status, code, message, [{ location: 'body', field: 'data', message }]);

export async function setEventImage(id: string, input: ImageInput, now: Date = new Date()): Promise<AdminEvent> {
  if (!(await Event.count({ where: { id } }))) throw notFound();
  if (input.data.length > MAX_IMAGE_BYTES) {
    throw imageError(413, 'image_too_large', 'A foto passou de 4 MB. Escolha uma menor.');
  }
  const mime = detectImageMime(input.data);
  if (!mime) throw imageError(400, 'invalid_image', 'O arquivo não é uma foto JPG, PNG, GIF ou WebP.');

  await Event.update(
    { imageData: input.data, imageMime: mime, imageAlt: input.alt, imageAuthorizedAt: now, imageUpdatedAt: now },
    { where: { id }, fields: ['imageData', 'imageMime', 'imageAlt', 'imageAuthorizedAt', 'imageUpdatedAt'] },
  );
  return getAdminEvent(id);
}

export async function removeEventImage(id: string): Promise<AdminEvent> {
  if (!(await Event.count({ where: { id } }))) throw notFound();
  await Event.update(
    { imageData: null, imageMime: null, imageAlt: null, imageAuthorizedAt: null, imageUpdatedAt: null },
    { where: { id }, fields: ['imageData', 'imageMime', 'imageAlt', 'imageAuthorizedAt', 'imageUpdatedAt'] },
  );
  return getAdminEvent(id);
}

export async function findEventImageForStaff(id: string): Promise<Event> {
  const event = await Event.findOne({ attributes: ['id', 'imageData', 'imageMime', 'imageUpdatedAt'], where: { id } });
  if (!event) throw notFound();
  if (!event.imageData) throw new ApiError(404, 'image_not_found', 'Esta atividade não tem foto.');
  return event;
}
