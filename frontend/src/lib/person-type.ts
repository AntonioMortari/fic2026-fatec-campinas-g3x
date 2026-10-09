import type { PersonType } from '../services/auth'

export const PERSON_TYPE_LABELS: Record<PersonType, string> = {
  individual: 'Pessoa física',
  organization: 'Organização (pessoa jurídica)',
}

// The account screens (design 7a and 7b) say "Empresa"; the sign-up form keeps the longer wording above.
export const PERSON_TYPE_SHORT_LABELS: Record<PersonType, string> = {
  individual: 'Pessoa física',
  organization: 'Empresa',
}
