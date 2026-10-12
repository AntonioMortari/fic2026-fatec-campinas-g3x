import { z } from 'zod';
import { nameField, personTypeField, phoneField } from './fields.validator';

// Only these three reach the service: Zod drops everything else, so the body cannot name an e-mail or a role.
export const profileBody = z.object({ name: nameField, phone: phoneField, personType: personTypeField });
