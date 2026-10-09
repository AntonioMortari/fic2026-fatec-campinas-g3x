import type { RouteObject } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { ComponentCatalog } from './pages/ComponentCatalog'
import { Agenda } from './pages/Agenda'
import { HomeContainer } from './pages/HomeContainer'
import { NotFound } from './pages/NotFound'

const DEV_ONLY: RouteObject[] = import.meta.env.DEV ? [{ path: '/componentes', element: <ComponentCatalog /> }] : []

export const routes: RouteObject[] = [
  {
    element: <Layout />,
    children: [{ path: '/', element: <HomeContainer /> }, { path: '/agenda', element: <Agenda /> }, ...DEV_ONLY, { path: '*', element: <NotFound /> }],
  },
]
