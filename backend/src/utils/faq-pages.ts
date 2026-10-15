// Pages a frequently asked answer can link to at its end, and pages it can say it was copied from. Only pages that exist: a link to the 404 is
// worse than no link, and an answer must repeat what a page already says (design 18). /doar and /privacidade join when those pages exist.
export const FAQ_LINKS = [
  { to: '/agenda', label: 'Agenda' },
  { to: '/contato', label: 'Contato' },
  { to: '/voluntariado', label: 'Voluntariado' },
  { to: '/para-escolas', label: 'Para escolas' },
  { to: '/quem-somos', label: 'Quem somos' },
  { to: '/galeria', label: 'Galeria' },
  { to: '/noticias', label: 'Notícias' },
] as const;

export const FAQ_SOURCES = [
  { id: 'agenda', label: 'Agenda' },
  { id: 'registration-form', label: 'Formulário de inscrição' },
  { id: 'about', label: 'Quem somos' },
  { id: 'schools', label: 'Para escolas' },
  { id: 'volunteering', label: 'Voluntariado' },
  { id: 'contact', label: 'Contato' },
] as const;

export const FAQ_LINK_PATHS = FAQ_LINKS.map((link) => link.to) as [string, ...string[]];
export const FAQ_SOURCE_IDS = FAQ_SOURCES.map((source) => source.id) as [string, ...string[]];

export const faqLinkLabel = (to: string | null): string | null => FAQ_LINKS.find((link) => link.to === to)?.label ?? null;
