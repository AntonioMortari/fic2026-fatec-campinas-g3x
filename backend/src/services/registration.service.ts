import { Op, UniqueConstraintError } from 'sequelize';
import { sequelize, Event, Registration, User } from '../models';
import { ApiError } from '../utils/api-error';
import { isValidCpf } from '../utils/cpf';
import { countRegistrations, isOver, spotsLeft, toPublicEvent, type PublicEvent } from './events.service';

// A guardian may sign up several children with one address; nobody needs a hundred.
export const MAX_PER_EMAIL = 5;

// A school class leaves through one connection, so this has to hold a whole class; a script cannot get past it.
export const MAX_PER_ORIGIN_PER_HOUR = 30;
const HOUR_MS = 60 * 60 * 1000;

export interface RegistrationInput {
  name: string;
  email: string;
  phone: string | null;
  cpf: string | null;
  isMinor: boolean;
  guardianName: string | null;
  guardianPhone: string | null;
  imageAuthorized: boolean;
}

export interface RegistrationResult {
  registration: { id: string; name: string; createdAt: string; cancelCode: string };
  event: PublicEvent;
}

const fieldError = (field: string, message: string) => new ApiError(400, 'invalid_data', 'Confira os dados enviados.', [{ location: 'body', field, message }]);

export async function registerForEvent(
  eventId: string,
  input: RegistrationInput,
  accountId: string | null,
  origin: string | null,
  now: Date = new Date(),
): Promise<RegistrationResult> {
  if (accountId && !(await User.count({ where: { id: accountId } }))) {
    throw new ApiError(401, 'unauthenticated', 'Entre na sua conta para continuar.');
  }

  return sequelize.transaction(async (transaction) => {
    // Locking the event row makes two people sending the last spot at the same time wait for each other: the second
    // one counts after the first one is saved. Checking on the server without the lock would let both in.
    const event = await Event.findOne({ where: { id: eventId, published: true }, transaction, lock: transaction.LOCK.UPDATE });
    if (!event) throw new ApiError(404, 'event_not_found', 'Não encontramos essa atividade.');
    if (isOver(event, now)) throw new ApiError(409, 'registrations_closed', 'As inscrições desta atividade já encerraram.');

    // Whether a document is asked comes from the event in the database, never from the form.
    let cpf: string | null = null;
    if (event.requiresCpf) {
      if (!input.cpf) throw fieldError('cpf', 'Esta atividade pede o CPF de quem vai participar.');
      if (!isValidCpf(input.cpf)) throw fieldError('cpf', 'Confira o CPF: ele precisa ter 11 números válidos.');
      cpf = input.cpf;
    }

    const alreadyIn = await Registration.findOne({ where: { eventId, email: input.email, name: input.name, cancelledAt: null }, transaction });
    if (alreadyIn) throw new ApiError(409, 'already_registered', 'Essa pessoa já está inscrita nesta atividade.');

    const registered = (await countRegistrations([eventId], transaction)).get(eventId) ?? 0;
    if (spotsLeft(event.capacity, registered) === 0) {
      throw new ApiError(409, 'event_full', 'As vagas desta atividade acabaram.');
    }

    if ((await Registration.count({ where: { eventId, email: input.email, cancelledAt: null }, transaction })) >= MAX_PER_EMAIL) {
      throw new ApiError(429, 'too_many_registrations', `Cada e-mail pode inscrever até ${MAX_PER_EMAIL} pessoas na mesma atividade.`);
    }

    if (origin) {
      const recent = await Registration.count({ where: { originHash: origin, createdAt: { [Op.gte]: new Date(now.getTime() - HOUR_MS) } }, transaction });
      if (recent >= MAX_PER_ORIGIN_PER_HOUR) {
        throw new ApiError(429, 'too_many_requests', 'Chegaram muitas inscrições por esta conexão. Tente de novo daqui a pouco.');
      }
    }

    try {
      // Every column is listed by hand; userId comes from the verified token, never from the body.
      const registration = await Registration.create(
        {
          eventId,
          userId: accountId,
          name: input.name,
          email: input.email,
          phone: input.phone,
          cpf,
          isMinor: input.isMinor,
          guardianName: input.isMinor ? input.guardianName : null,
          guardianPhone: input.isMinor ? input.guardianPhone : null,
          imageAuthorized: input.imageAuthorized,
          consentedAt: now,
          originHash: origin,
        },
        { transaction },
      );
      return {
        registration: { id: registration.id, name: registration.name, createdAt: registration.createdAt.toISOString(), cancelCode: registration.cancelCode },
        event: toPublicEvent(event, registered + 1),
      };
    } catch (error) {
      if (error instanceof UniqueConstraintError) {
        throw new ApiError(409, 'already_registered', 'Essa pessoa já está inscrita nesta atividade.');
      }
      throw error;
    }
  });
}
