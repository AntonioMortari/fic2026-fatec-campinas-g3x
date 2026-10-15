import { CONTACTS } from './contacts'

export type AnswerPart = string | { text: string; to: string }

export interface FaqTheme {
  id: string
  name: string
}

export interface FaqItem {
  id: string
  theme: string
  question: string
  answer: AnswerPart[]
}

export const FAQ_PATH = '/perguntas-frequentes'

// Design 18: the answers repeat what another page already says, never new information. "Como posso apoiar o Ateliê?" and "Como peço para ver,
// corrigir ou apagar os meus dados?" are not here because the pages they repeat (/doar and /privacidade) do not exist yet; they come in with them.
export const FAQ_THEMES: FaqTheme[] = [
  { id: 'participar', name: 'Participar das atividades' },
  { id: 'escolas', name: 'Para escolas' },
  { id: 'voluntariado-e-apoio', name: 'Voluntariado e apoio' },
  { id: 'dados-e-contato', name: 'Seus dados e contato' },
]

export const FAQ_ITEMS: FaqItem[] = [
  {
    id: 'conta-para-inscrever',
    theme: 'participar',
    question: 'Preciso criar conta para me inscrever numa atividade?',
    answer: ['Não. Para se inscrever não é preciso criar conta — basta preencher o formulário do evento. As atividades abertas estão na ', { text: 'agenda', to: '/agenda' }, '.'],
  },
  {
    id: 'imagem',
    theme: 'participar',
    question: 'Preciso autorizar o uso da minha imagem para participar?',
    answer: [
      'Não. Nas oficinas e apresentações a gente às vezes fotografa, mas nenhuma foto vai para o site sem autorização registrada, e você pode participar sem autorizar — é só deixar a caixa de autorização desmarcada na inscrição.',
    ],
  },
  {
    id: 'menores',
    theme: 'participar',
    question: 'Quem tem menos de 18 anos pode se inscrever?',
    answer: ['Pode. Na inscrição há um campo para marcar que quem vai participar tem menos de 18 anos, e então o nome e o telefone de um responsável são obrigatórios.'],
  },
  {
    id: 'para-quem',
    theme: 'participar',
    question: 'Para quem são as atividades?',
    answer: ['Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.'],
  },
  {
    id: 'onde-fica',
    theme: 'participar',
    question: 'Onde fica o Ateliê?',
    answer: [`No bairro da Casa Verde, zona norte de São Paulo: ${CONTACTS.street}, ${CONTACTS.city} — CEP ${CONTACTS.postalCode}. Veja o mapa em `, { text: 'contato', to: '/contato' }, '.'],
  },
  {
    id: 'escola-duracao',
    theme: 'escolas',
    question: 'Quanto dura uma atividade para escola e qual é a classificação?',
    answer: ['A classificação é livre. A duração é de 50 minutos na maioria das atividades; algumas são a combinar.'],
  },
  {
    id: 'escola-providenciar',
    theme: 'escolas',
    question: 'O que a escola precisa providenciar?',
    answer: [
      'Um espaço para a apresentação (adaptamos ao que a escola tiver), 1 caixa de som e 1 microfone, com ou sem fio, conforme a atividade. A ficha técnica de cada atividade traz o que ela pede em detalhe.',
    ],
  },
  {
    id: 'voluntario',
    theme: 'voluntariado-e-apoio',
    question: 'Como faço para ser voluntário ou voluntária?',
    answer: [
      'Você cria uma conta e escolhe suas áreas de interesse. A gente lê a candidatura, entra em contato para conversar e combina junto o que faz sentido para você e para o ateliê. Comece pela página de ',
      { text: 'voluntariado', to: '/voluntariado' },
      '.',
    ],
  },
  {
    id: 'falar',
    theme: 'dados-e-contato',
    question: 'Como falo com o Ateliê?',
    answer: [`Pelo WhatsApp ${CONTACTS.phoneDisplay}, pelo e-mail ${CONTACTS.email} ou pelo formulário da página de `, { text: 'contato', to: '/contato' }, '.'],
  },
]

export function answerText(item: FaqItem): string {
  return item.answer.map((part) => (typeof part === 'string' ? part : part.text)).join('')
}

const plain = (text: string) => text.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()

export function searchWords(term: string): string[] {
  return plain(term)
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .slice(0, 8)
}

export function filterFaq(items: FaqItem[], term: string): FaqItem[] {
  const words = searchWords(term)
  if (words.length === 0) return items
  return items.filter((item) => {
    const haystack = plain(`${item.question} ${answerText(item)}`)
    return words.every((word) => haystack.includes(word))
  })
}
