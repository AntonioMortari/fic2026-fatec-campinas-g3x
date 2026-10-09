import type { PersonType } from '../services/auth'

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  individual: 'Pessoa física',
  organization: 'Organização (pessoa jurídica)',
}
