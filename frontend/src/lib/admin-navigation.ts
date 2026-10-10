import { isActiveRoute, type Destination } from './navigation'

export const ADMIN_HOME: Destination = { label: 'Início', to: '/admin' }
export const ADMIN_EVENTS: Destination = { label: 'Agenda', to: '/admin/eventos' }
export const ADMIN_REPORT: Destination = { label: 'Relatório', to: '/admin/relatorio' }

export const ADMIN_BOTTOM_BAR: Destination[] = [ADMIN_HOME, ADMIN_EVENTS]

export interface AdminGroup {
  title?: string
  items: Destination[]
}

// The panel menu (designs 9a and 10e). Only screens that exist: the design also lists Atividades, Contatos, Voluntários,
// Doações, Depoimentos, Publicações, Galeria, Biblioteca, Avisos, Exportar and Configurações, which would lead to the 404.
export const ADMIN_SIDEBAR_GROUPS: AdminGroup[] = [
  { items: [ADMIN_HOME] },
  { title: 'Agenda', items: [{ label: 'Eventos e presença', to: ADMIN_EVENTS.to }] },
  { title: 'Gestão', items: [ADMIN_REPORT] },
]

// "Mais" on the phone (design 10e): what the bottom bar does not show.
export const ADMIN_MORE_GROUPS: AdminGroup[] = [
  { title: 'Gestão', items: [ADMIN_REPORT] },
  { title: 'Conta', items: [{ label: 'Minha conta', to: '/minha-conta' }] },
]

// "/admin" is the prefix of every panel route, so the home only matches itself.
export function isActiveAdminRoute(target: string, current: string): boolean {
  return target === ADMIN_HOME.to ? current === target : isActiveRoute(target, current)
}
