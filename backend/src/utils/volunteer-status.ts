import type { VolunteerStatus } from '../models/volunteer-application.model';

export const STAFF_STATUS_LABELS: Record<VolunteerStatus, string> = {
  new: 'Nova',
  in_contact: 'Em contato',
  volunteering: 'Voluntariando',
  ended: 'Encerrada',
};

export const STATUS_QUEUE_RANK: Record<VolunteerStatus, number> = {
  new: 0,
  in_contact: 1,
  volunteering: 2,
  ended: 3,
};
