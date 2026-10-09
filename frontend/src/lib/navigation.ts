export interface Destination {
  label: string
  to: string
}

export interface MenuGroup {
  title: string
  tone: 'ochre' | 'blue' | 'brown'
  items: Destination[]
}

export const HOME: Destination = { label: 'Início', to: '/' }
export const SUPPORT: Destination = { label: 'Apoiar', to: '/doar' }

export const BOTTOM_BAR: Destination[] = [HOME, { label: 'Agenda', to: '/agenda' }, { label: 'Projetos', to: '/projetos' }]

export const DESKTOP_NAV: Destination[] = [
  HOME,
  { label: 'Agenda', to: '/agenda' },
  { label: 'Projetos', to: '/projetos' },
  { label: 'Quem somos', to: '/quem-somos' },
]

export const MENU_GROUPS: MenuGroup[] = [
  {
    title: 'Conhecer',
    tone: 'ochre',
    items: [
      { label: 'Quem somos', to: '/quem-somos' },
      { label: 'Projetos', to: '/projetos' },
      { label: 'Galeria', to: '/galeria' },
    ],
  },
  {
    title: 'Participar',
    tone: 'blue',
    items: [
      { label: 'Agenda', to: '/agenda' },
      { label: 'Voluntariado', to: '/voluntariado' },
      { label: 'Para escolas', to: '/para-escolas' },
    ],
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

export function isActiveRoute(target: string, current: string): boolean {
  if (target === '/') return current === '/'
  return current === target || current.startsWith(`${target}/`)
}

export function labelForRoute(path: string): string | null {
  const known = [HOME, ...DESKTOP_NAV, ...MENU_GROUPS.flatMap((group) => group.items), SUPPORT, { label: 'Minha conta', to: '/minha-conta' }]
  return known.find((destination) => destination.to === path)?.label ?? null
}
