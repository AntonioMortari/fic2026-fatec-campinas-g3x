import type { RouteObject } from 'react-router-dom'
import { Layout } from './componentes/Layout'
import { Inicio } from './paginas/Inicio'
import { NaoEncontrada } from './paginas/NaoEncontrada'

/** Mapa de rotas do site (RNF-FE-04). Cada página nova entra aqui. */
export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [
      { path: '/', element: <Inicio /> },
      { path: '*', element: <NaoEncontrada /> },
    ],
  },
]
