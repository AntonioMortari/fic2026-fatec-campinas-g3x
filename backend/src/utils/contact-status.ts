import type { ContactStatus } from '../models/contact.model';

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  new: 'Nova',
  in_contact: 'Em contato',
  done: 'Concluída',
};
