import type { RouteObject } from 'react-router-dom'
import { RequireAuth } from './components/auth/RequireAuth'
import { FocusedLayout } from './components/layout/FocusedLayout'
import { Layout } from './components/layout/Layout'
import { Account } from './pages/Account'
import { Auth } from './pages/Auth'
import { ComponentCatalog } from './pages/ComponentCatalog'
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
  { element: <FocusedLayout />, children: [{ path: '/entrar', element: <Auth /> }] },
]
