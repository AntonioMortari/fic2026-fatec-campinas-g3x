// What the site already said when the questions moved into the database (design 18, "as 11 de hoje entram como carga inicial"): nine of the eleven,
// because the other two repeat pages that do not exist yet (/doar and /privacidade).
export const FAQ_INITIAL_THEMES = [
  { id: 'participar', name: 'Participar das atividades' },
  { id: 'escolas', name: 'Para escolas' },
  { id: 'voluntariado-e-apoio', name: 'Voluntariado e apoio' },
  { id: 'dados-e-contato', name: 'Seus dados e contato' },
];

export const FAQ_INITIAL_ITEMS = [
  { id: 'conta-para-inscrever', theme: 'participar', source: 'agenda', link: '/agenda', question: 'Preciso criar conta para me inscrever numa atividade?', answer: 'Não. Para se inscrever não é preciso criar conta — basta preencher o formulário do evento. As atividades abertas estão na agenda.' },
  { id: 'imagem', theme: 'participar', source: 'registration-form', link: null, question: 'Preciso autorizar o uso da minha imagem para participar?', answer: 'Não. Nas oficinas e apresentações a gente às vezes fotografa, mas nenhuma foto vai para o site sem autorização registrada, e você pode participar sem autorizar — é só deixar a caixa de autorização desmarcada na inscrição.' },
  { id: 'menores', theme: 'participar', source: 'registration-form', link: null, question: 'Quem tem menos de 18 anos pode se inscrever?', answer: 'Pode. Na inscrição há um campo para marcar que quem vai participar tem menos de 18 anos, e então o nome e o telefone de um responsável são obrigatórios.' },
  { id: 'para-quem', theme: 'participar', source: 'about', link: null, question: 'Para quem são as atividades?', answer: 'Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.' },
  { id: 'onde-fica', theme: 'participar', source: 'about', link: '/contato', question: 'Onde fica o Ateliê?', answer: 'No bairro da Casa Verde, zona norte de São Paulo: Rua Dr. Paulo Gatti, 135 — Vila Romero, São Paulo/SP — CEP 02468-030. O mapa está na página de contato.' },
  { id: 'escola-duracao', theme: 'escolas', source: 'schools', link: null, question: 'Quanto dura uma atividade para escola e qual é a classificação?', answer: 'A classificação é livre. A duração é de 50 minutos na maioria das atividades; algumas são a combinar.' },
  { id: 'escola-providenciar', theme: 'escolas', source: 'schools', link: null, question: 'O que a escola precisa providenciar?', answer: 'Um espaço para a apresentação (adaptamos ao que a escola tiver), 1 caixa de som e 1 microfone, com ou sem fio, conforme a atividade. A ficha técnica de cada atividade traz o que ela pede em detalhe.' },
  { id: 'voluntario', theme: 'voluntariado-e-apoio', source: 'volunteering', link: '/voluntariado', question: 'Como faço para ser voluntário ou voluntária?', answer: 'Você cria uma conta e escolhe suas áreas de interesse. A gente lê a candidatura, entra em contato para conversar e combina junto o que faz sentido para você e para o ateliê. Comece pela página de voluntariado.' },
  { id: 'falar', theme: 'dados-e-contato', source: 'contact', link: '/contato', question: 'Como falo com o Ateliê?', answer: 'Pelo WhatsApp (11) 95396-8344, pelo e-mail atelieafro@gmail.com ou pelo formulário da página de contato.' },
];
