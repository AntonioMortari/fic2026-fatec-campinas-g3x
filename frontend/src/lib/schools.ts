export interface SpecRow {
  term: string
  detail: string
}

export interface Venue {
  title: string
  detail?: string
}

export const SPEC_SHEET: SpecRow[] = [
  { term: 'Público', detail: 'Crianças, jovens e adultos, de todas as etnias e faixas etárias' },
  { term: 'Classificação', detail: 'Livre' },
  { term: 'Duração', detail: '50 minutos na maioria das atividades; algumas a combinar' },
  { term: 'Local', detail: 'Adaptável a qualquer espaço' },
]

export const REQUIREMENTS: string[] = [
  'Um espaço para a apresentação — adaptamos ao que a escola tiver',
  '1 caixa de som',
  '1 microfone, com ou sem fio, conforme a atividade',
]

export const PAST_VENUES: Venue[] = [
  { title: 'SESC Interlagos' },
  { title: 'SESC Santo Amaro' },
  { title: 'Fábricas de Cultura', detail: 'Jaçanã' },
  { title: 'Casas de Cultura de São Paulo', detail: 'Inclui a Casa de Cultura São Rafael' },
  { title: 'Teatro Municipal Adélia Lorenzetti' },
  { title: 'Praças da Cultura', detail: 'Subprefeitura Pirituba/Jaraguá' },
  { title: 'Espaço Malungo' },
  { title: 'Ambev', detail: 'Ação de Dia das Crianças, Campinas · 2021' },
  { title: 'Subsecretaria de Igualdade Racial', detail: 'II Festa Preta, Parque Bosque Maia' },
  { title: 'Mês da Consciência Negra', detail: 'Programação recorrente' },
  { title: '(Re)Existência do Povo Negro', detail: 'SESC' },
]

export const CATALOG_PATH = '/projetos'
export const CONTACT_PATH = '/contato'
