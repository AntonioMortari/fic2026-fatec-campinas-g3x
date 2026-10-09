import { sequelize, Event, Registration } from '../models';
import { ApiError } from '../utils/api-error';
import { shortName } from '../utils/short-name';
import { isOver } from './events.service';

export type CancelState = 'active' | 'cancelled' | 'over';

// What anyone holding the personal link may read: the event and the short name, nothing else (no contact, no CPF).
export interface CancelPreview {
  state: CancelState;
  name: string;
  event: { id: string; title: string; startsAt: string; endsAt: string | null; location: string | null };
}

const notFound = () => new ApiError(404, 'registration_not_found', 'Não encontramos essa inscrição.');

function toPreview(registration: Registration, event: Event, now: Date): CancelPreview {
  return {
    state: registration.cancelledAt ? 'cancelled' : isOver(event, now) ? 'over' : 'active',
    name: shortName(registration.name),
    event: {
      id: event.id,
      title: event.title,
      startsAt: event.startsAt.toISOString(),
      endsAt: event.endsAt ? event.endsAt.toISOString() : null,
      location: event.location,
    },
  };
}

export async function getCancelPreview(code: string, now: Date = new Date()): Promise<CancelPreview> {
  const registration = await Registration.findOne({ where: { cancelCode: code } });
  const event = registration ? await Event.findByPk(registration.eventId) : null;
  if (!registration || !event) throw notFound();
  return toPreview(registration, event, now);
}

// The link is the proof: it is a random UUID that only the person who signed up was given. Cancelling twice, or after the
// event, is refused with its own code so the screen can say why.
export async function cancelRegistration(code: string, now: Date = new Date()): Promise<CancelPreview> {
  return sequelize.transaction(async (transaction) => {
    const registration = await Registration.findOne({ where: { cancelCode: code }, transaction, lock: transaction.LOCK.UPDATE });
    const event = registration ? await Event.findByPk(registration.eventId, { transaction }) : null;
    if (!registration || !event) throw notFound();
    if (registration.cancelledAt) throw new ApiError(409, 'already_cancelled', 'Esta inscrição já foi cancelada.');
    if (isOver(event, now)) throw new ApiError(409, 'registrations_closed', 'Esta atividade já aconteceu: a inscrição não pode mais ser cancelada.');

    await registration.update({ cancelledAt: now }, { transaction });
    return toPreview(registration, event, now);
  });
}
