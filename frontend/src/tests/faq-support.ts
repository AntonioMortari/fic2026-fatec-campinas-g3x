import type { AdminFaq, AdminFaqItem, PublicFaqTheme } from '../types/faq'

export const PUBLIC_FAQ: PublicFaqTheme[] = [
  {
    id: 'participar',
    name: 'Participar das atividades',
    items: [
      { id: 'conta-para-inscrever', question: 'Preciso criar conta para me inscrever numa atividade?', answer: 'Não. Para se inscrever não é preciso criar conta — basta preencher o formulário do evento.', link: { to: '/agenda', label: 'Agenda' } },
      { id: 'imagem', question: 'Preciso autorizar o uso da minha imagem para participar?', answer: 'Não. Nenhuma foto vai para o site sem autorização registrada.', link: null },
      { id: 'menores', question: 'Quem tem menos de 18 anos pode se inscrever?', answer: 'Pode, com o nome e o telefone de um responsável.', link: null },
    ],
  },
  {
    id: 'escolas',
    name: 'Para escolas',
    items: [
      { id: 'escola-duracao', question: 'Quanto dura uma atividade para escola e qual é a classificação?', answer: 'A classificação é livre. A duração é de 50 minutos na maioria.', link: null },
      { id: 'escola-providenciar', question: 'O que a escola precisa providenciar?', answer: 'Um espaço, 1 caixa de som e 1 microfone.', link: null },
    ],
  },
  { id: 'voluntariado-e-apoio', name: 'Voluntariado e apoio', items: [{ id: 'voluntario', question: 'Como faço para ser voluntário ou voluntária?', answer: 'Você cria uma conta e escolhe suas áreas de interesse.', link: { to: '/voluntariado', label: 'Voluntariado' } }] },
]

export const faqItem = (overrides: Partial<AdminFaqItem> = {}): AdminFaqItem => ({
  id: 'imagem',
  themeId: 'participar',
  question: 'Preciso autorizar o uso da minha imagem para participar?',
  answer: 'Não. Nenhuma foto vai para o site sem autorização registrada.',
  linkTo: null,
  source: 'registration-form',
  published: true,
  sortOrder: 1,
  ...overrides,
})

export const ADMIN_FAQ: AdminFaq = {
  themes: [
    { id: 'participar', name: 'Participar das atividades', published: true, sortOrder: 1 },
    { id: 'escolas', name: 'Para escolas', published: true, sortOrder: 2 },
  ],
  items: [
    faqItem(),
    faqItem({ id: 'menores', question: 'Quem tem menos de 18 anos pode se inscrever?', answer: 'Pode.', published: false, sortOrder: 2 }),
    faqItem({ id: 'escola-duracao', themeId: 'escolas', question: 'Quanto dura uma atividade para escola?', answer: 'A classificação é livre.', source: 'schools', linkTo: '/contato', sortOrder: 1 }),
  ],
  options: {
    links: [
      { to: '/agenda', label: 'Agenda' },
      { to: '/contato', label: 'Contato' },
    ],
    sources: [
      { id: 'registration-form', label: 'Formulário de inscrição' },
      { id: 'schools', label: 'Para escolas' },
      { id: 'agenda', label: 'Agenda' },
    ],
  },
}
