import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { ProvedorDeLeitura } from '../contextos/PreferenciasDeLeitura'
import { rotas } from '../rotas'

/** Monta a aplicação como o main.tsx, numa rota escolhida. */
export function abrirRota(endereco: string, mapa: RouteObject[] = rotas) {
  const roteador = createMemoryRouter(mapa, { initialEntries: [endereco] })
  render(
    <ProvedorDeLeitura>
      <RouterProvider router={roteador} />
    </ProvedorDeLeitura>,
  )
  return roteador
}

/** Um componente solto, dentro de um roteador (para os que usam <Link>). */
export function renderizarComRoteador(elemento: ReactNode, endereco = '/') {
  return abrirRota(endereco, [{ path: '*', element: <ProvedorDeLeitura>{elemento}</ProvedorDeLeitura> }])
}
