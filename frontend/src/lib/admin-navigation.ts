import { isActiveRoute, type Destination } from './navigation'

export const ADMIN_HOME: Destination = { label: 'Início', to: '/admin' }
export const ADMIN_EVENTS: Destination = { label: 'Agenda', to: '/admin/eventos' }

export const ADMIN_BOTTOM_BAR: Destination[] = [ADMIN_HOME, ADMIN_EVENTS]

// The side menu of the desktop panel (screen 7j). Only screens that exist: the design also lists Atividades, Pessoas,
// Conteúdo, Biblioteca and Configurações, which are not built yet and would lead to the 404.
export const ADMIN_SIDEBAR: Destination[] = [ADMIN_HOME, { label: 'Agenda e presença', to: '/admin/eventos' }, { label: 'Relatório', to: '/admin/relatorio' }]

export const ADMIN_QUICK_ACTIONS: Destination[] = [{ label: 'Novo evento', to: '/admin/eventos/novo' }]

export const ADMIN_SCREENS: (Destination & { description: string })[] = [
  { label: 'Eventos', to: '/admin/eventos', description: 'Cadastrar, corrigir e publicar as atividades da agenda.' },
  { label: 'Relatório', to: '/admin/relatorio', description: 'Números do período e quem veio em cada atividade, para a prestação de contas.' },
]

// "/admin" is the prefix of every panel route, so the home only matches itself.
export function isActiveAdminRoute(target: string, current: string): boolean {
  return target === ADMIN_HOME.to ? current === target : isActiveRoute(target, current)
}
