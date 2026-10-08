import type { RouteObject } from 'react-router-dom'
import { Layout } from './componentes/estrutura/Layout'
import { CatalogoDeComponentes } from './paginas/CatalogoDeComponentes'
import { Inicio } from './paginas/Inicio'
import { NaoEncontrada } from './paginas/NaoEncontrada'

/**
 * Mapa de rotas do site (RNF-FE-04). Cada página nova entra aqui.
 * Telas de conta (entrar, recuperar acesso, nova senha) usam `LayoutFocado`,
 * sem barra inferior nem rodapé.
 */
const SO_EM_DESENVOLVIMENTO: RouteObject[] = import.meta.env.DEV
  ? [{ path: '/componentes', element: <CatalogoDeComponentes /> }]
  : []

export const rotas: RouteObject[] = [
  {
    element: <Layout />,
    children: [{ path: '/', element: <Inicio /> }, ...SO_EM_DESENVOLVIMENTO, { path: '*', element: <NaoEncontrada /> }],
  },
]
