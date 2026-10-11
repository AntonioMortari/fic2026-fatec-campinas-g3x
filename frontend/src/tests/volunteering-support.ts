import type { AdminVolunteerApplication, MyVolunteerApplication, VolunteerArea } from '../types/volunteering'

export const AREAS: VolunteerArea[] = [
  { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas', description: 'Reforço escolar, contação de histórias, oficinas de percussão, dança, turbantes e artes manuais.' },
  { id: 'comunicacao', name: 'Comunicação e mídias', description: 'Fotos, vídeos, textos para redes sociais, divulgação de projetos e editais.' },
  { id: 'producao-eventos', name: 'Produção de eventos', description: 'Montagem de exposições, recepção de público, feiras culturais, apresentações.' },
  { id: 'acervo', name: 'Organização de acervo', description: 'Catalogação de livros, roupas, instrumentos musicais, fantasias e peças de memória ancestral.' },
  { id: 'administrativo', name: 'Apoio administrativo', description: 'Captação de recursos, planejamento de projetos, atendimento à comunidade.' },
]

export const mine = (overrides: Partial<MyVolunteerApplication> = {}): MyVolunteerApplication => ({
  id: 'a1',
  status: 'new',
  message: null,
  createdAt: '2026-10-09T17:20:00.000Z',
  areas: [
    { id: 'apoio-pedagogico', name: 'Apoio pedagógico e oficinas' },
    { id: 'comunicacao', name: 'Comunicação e mídias' },
  ],
  ...overrides,
})

export const queueEntry = (overrides: Partial<AdminVolunteerApplication> = {}): AdminVolunteerApplication => ({
  ...mine(),
  updatedAt: '2026-10-09T17:20:00.000Z',
  name: 'Larissa Mendes',
  email: 'larissa@exemplo.com',
  phone: '11981234567',
  message: 'Sou pedagoga e tenho as manhãs de sábado livres.',
  ...overrides,
})

export const COUNTS = { all: 5, new: 2, in_contact: 1, volunteering: 1, ended: 1 }
