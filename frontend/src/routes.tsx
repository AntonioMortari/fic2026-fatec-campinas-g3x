import type { RouteObject } from 'react-router-dom'
import { RequireStaff } from './components/admin/RequireStaff'
import { RequireAuth } from './components/auth/RequireAuth'
import { FocusedLayout } from './components/layout/FocusedLayout'
import { Layout } from './components/layout/Layout'
import { About } from './pages/About'
import { Account } from './pages/Account'
import { AccountEdit } from './pages/AccountEdit'
import { AdminAttendance } from './pages/admin/AdminAttendance'
import { AdminEventForm } from './pages/admin/AdminEventForm'
import { AdminEvents } from './pages/admin/AdminEvents'
import { AdminHome } from './pages/admin/AdminHome'
import { AdminReport } from './pages/admin/AdminReport'
import { AdminRegistrants } from './pages/admin/AdminRegistrants'
import { AdminContacts } from './pages/admin/AdminContacts'
import { AdminVolunteers } from './pages/admin/AdminVolunteers'
import { Auth } from './pages/Auth'
import { EventRegistration } from './pages/EventRegistration'
import { ComponentCatalog } from './pages/ComponentCatalog'
import { CancelDone } from './pages/CancelDone'
import { CancelRegistration } from './pages/CancelRegistration'
import { Agenda } from './pages/Agenda'
import { HomeContainer } from './pages/HomeContainer'
import { NotFound } from './pages/NotFound'
import { MyVolunteerApplications } from './pages/MyVolunteerApplications'
import { VolunteerApplicationPage } from './pages/VolunteerApplication'
import { Volunteering } from './pages/Volunteering'
import { Contact } from './pages/Contact'
import { News } from './pages/News'
import { NewsDetail } from './pages/NewsDetail'
import { Schools } from './pages/Schools'

const DEV_ONLY: RouteObject[] = import.meta.env.DEV ? [{ path: '/componentes', element: <ComponentCatalog /> }] : []

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <HomeContainer /> },
      { path: '/agenda', element: <Agenda /> },
      { path: '/quem-somos', element: <About /> },
      { path: '/inscricao/cancelada', element: <CancelDone /> },
      { path: '/voluntariado', element: <Volunteering /> },
      {
        element: <RequireAuth />,
        children: [
          { path: '/minha-conta', element: <Account /> },
          { path: '/minha-conta/candidaturas', element: <MyVolunteerApplications />, handle: { hideHeaderOnMobile: true } },
        ],
      },
      { path: '/contato', element: <Contact /> },
      { path: '/para-escolas', element: <Schools /> },
      { path: '/noticias', element: <News /> },
      { path: '/noticias/:id', element: <NewsDetail />, handle: { hideHeaderOnMobile: true } },
      ...DEV_ONLY,
      { path: '*', element: <NotFound /> },
    ],
  },
  { path: '/voluntariado/candidatura', element: <VolunteerApplicationPage /> },
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
      { path: '/admin/contatos', element: <AdminContacts /> },
      { path: '/admin/contatos/:id', element: <AdminContacts />, handle: { hideBottomBar: true, hideHeaderOnMobile: true } },
      { path: '/admin/voluntarios', element: <AdminVolunteers /> },
      { path: '/admin/voluntarios/:id', element: <AdminVolunteers />, handle: { hideBottomBar: true, hideHeaderOnMobile: true } },
    ],
  },
  {
    element: <FocusedLayout />,
    children: [
      { path: '/entrar', element: <Auth />, handle: { wide: true, genericBack: true } },
      { element: <RequireAuth />, children: [{ path: '/minha-conta/dados', element: <AccountEdit />, handle: { backTo: '/minha-conta', backLabel: 'Voltar para sua conta' } }] },
      { path: '/agenda/:id/inscricao', element: <EventRegistration />, handle: { backTo: '/agenda' } },
      { path: '/inscricao/cancelar', element: <CancelRegistration />, handle: { backTo: '/agenda', backLabel: 'Voltar para a agenda' } },
    ],
  },
]
