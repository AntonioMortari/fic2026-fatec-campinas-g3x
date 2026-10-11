export interface Destination {
  label: string
  to: string
  description?: string
}

export interface MenuGroup {
  title: string
  tone: 'ochre' | 'blue' | 'brown'
  items: Destination[]
}

export const HOME: Destination = { label: 'Início', to: '/' }
export const SUPPORT: Destination = { label: 'Apoiar', to: '/doar' }
export const PROJECTS: Destination = { label: 'Projetos', to: '/projetos' }
export const VOLUNTEER: Destination = { label: 'Voluntariado', to: '/voluntariado' }
export const SCHOOLS: Destination = { label: 'Para escolas', to: '/para-escolas' }

export const BOTTOM_BAR: Destination[] = [HOME, { label: 'Agenda', to: '/agenda' }, PROJECTS]

export const DESKTOP_NAV: Destination[] = [
  HOME,
  { label: 'Agenda', to: '/agenda' },
  PROJECTS,
  { label: 'Quem somos', to: '/quem-somos' },
]

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Conhecer',
    tone: 'ochre',
    items: [{ label: 'Quem somos', to: '/quem-somos' }, PROJECTS, { label: 'Galeria', to: '/galeria' }],
  },
  {
    title: 'Participar',
    tone: 'blue',
    items: [{ label: 'Agenda', to: '/agenda' }, VOLUNTEER, SCHOOLS],
  },
  {
    title: 'Ler',
    tone: 'brown',
    items: [
      { label: 'Notícias', to: '/noticias' },
      { label: 'Acervo', to: '/acervo' },
    ],
  },
]

export const DESKTOP_MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Conhecer',
    tone: 'ochre',
    items: [
      { label: 'Galeria', to: '/galeria', description: 'Fotos das oficinas e saraus' },
      { label: 'Notícias', to: '/noticias', description: 'O que aconteceu e o que vem' },
      { label: 'Acervo', to: '/acervo' },
    ],
  },
  {
    title: 'Participar',
    tone: 'blue',
    items: [
      { label: 'Voluntariado', to: '/voluntariado', description: 'Doe seu tempo e seu ofício' },
      { label: 'Para escolas', to: '/para-escolas', description: 'Leve uma oficina para sua turma' },
    ],
  },
  {
    title: 'Ajuda',
    tone: 'brown',
    items: [
      { label: 'Contato', to: '/contato', description: 'Escreva para a equipe' },
      { label: 'Privacidade', to: '/privacidade', description: 'Como cuidamos dos seus dados' },
    ],
  },
]

export function isActiveRoute(target: string, current: string): boolean {
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}

export function labelForRoute(path: string): string | null {
  const known = [HOME, ...DESKTOP_NAV, ...MENU_GROUPS.flatMap((group) => group.items), SUPPORT, { label: 'Minha conta', to: '/minha-conta' }]
  return known.find((destination) => destination.to === path)?.label ?? null
}

export function isMenuRoute(current: string, shownOutsideMenu: Destination[]): boolean {
  if (shownOutsideMenu.some((destination) => isActiveRoute(destination.to, current))) return false
  return [...MENU_GROUPS, ...DESKTOP_MENU_GROUPS].some((group) => group.items.some((item) => isActiveRoute(item.to, current)))
}
