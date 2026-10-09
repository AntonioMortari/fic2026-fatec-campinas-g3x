import { isActiveRoute, type Destination } from './navigation'

export const ADMIN_HOME: Destination = { label: 'Início', to: '/admin' }
export const ADMIN_EVENTS: Destination = { label: 'Agenda', to: '/admin/eventos' }

export const ADMIN_BOTTOM_BAR: Destination[] = [ADMIN_HOME, ADMIN_EVENTS]

export const ADMIN_QUICK_ACTIONS: Destination[] = [{ label: 'Novo evento', to: '/admin/eventos/novo' }]

export const ADMIN_SCREENS: (Destination & { description: string })[] = [
  { label: 'Eventos', to: '/admin/eventos', description: 'Cadastrar, corrigir e publicar as atividades da agenda.' },
]

// "/admin" is the prefix of every panel route, so the home only matches itself.
export function isActiveAdminRoute(target: string, current: string): boolean {
  return target === ADMIN_HOME.to ? current === target : isActiveRoute(target, current)
}
