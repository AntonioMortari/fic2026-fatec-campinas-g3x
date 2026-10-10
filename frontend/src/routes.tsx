import type { RouteObject } from 'react-router-dom'
import { RequireStaff } from './components/admin/RequireStaff'
import { RequireAuth } from './components/auth/RequireAuth'
import { FocusedLayout } from './components/layout/FocusedLayout'
import { Layout } from './components/layout/Layout'
import { Account } from './pages/Account'
import { AccountEdit } from './pages/AccountEdit'
import { AdminAttendance } from './pages/admin/AdminAttendance'
import { AdminEventForm } from './pages/admin/AdminEventForm'
import { AdminEvents } from './pages/admin/AdminEvents'
import { AdminHome } from './pages/admin/AdminHome'
import { AdminReport } from './pages/admin/AdminReport'
import { AdminRegistrants } from './pages/admin/AdminRegistrants'
import { Auth } from './pages/Auth'
import { EventRegistration } from './pages/EventRegistration'
import { ComponentCatalog } from './pages/ComponentCatalog'
import { CancelRegistration } from './pages/CancelRegistration'
import { Agenda } from './pages/Agenda'
import { HomeContainer } from './pages/HomeContainer'
import { NotFound } from './pages/NotFound'

const DEV_ONLY: RouteObject[] = import.meta.env.DEV ? [{ path: '/componentes', element: <ComponentCatalog /> }] : []

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomeContainer /> },
      { path: '/agenda', element: <Agenda /> },
      { element: <RequireAuth />, children: [{ path: '/minha-conta', element: <Account /> }] },
      ...DEV_ONLY,
      { path: '*', element: <NotFound /> },
    ],
  },
  {
    element: <RequireStaff />,
    children: [
      { path: '/admin', element: <AdminHome /> },
      { path: '/admin/eventos', element: <AdminEvents /> },
      { path: '/admin/eventos/novo', element: <AdminEventForm />, handle: { hideBottomBar: true, hideHeaderOnMobile: true } },
      { path: '/admin/eventos/:id/editar', element: <AdminEventForm />, handle: { hideBottomBar: true, hideHeaderOnMobile: true } },
      { path: '/admin/eventos/:id/inscritos', element: <AdminRegistrants /> },
      { path: '/admin/relatorio', element: <AdminReport />, handle: { hideBottomBar: true, hideHeaderOnMobile: true } },
      { path: '/admin/eventos/:id/presenca', element: <AdminAttendance />, handle: { hideHeaderOnMobile: true } },
    ],
  },
  {
    element: <FocusedLayout />,
    children: [
      { path: '/entrar', element: <Auth />, handle: { wide: true, genericBack: true } },
      { element: <RequireAuth />, children: [{ path: '/minha-conta/dados', element: <AccountEdit />, handle: { backTo: '/minha-conta', backLabel: 'Voltar para sua conta' } }] },
      { path: '/agenda/:id/inscricao', element: <EventRegistration />, handle: { backTo: '/agenda' } },
      { path: '/inscricao/cancelar', element: <CancelRegistration />, handle: { backTo: '/agenda' } },
    ],
  },
]
