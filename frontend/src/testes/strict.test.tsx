import { render, screen } from '@testing-library/react'
import { StrictMode } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { ProvedorDeLeitura } from '../contextos/PreferenciasDeLeitura'
import { rotas } from '../rotas'

it('no StrictMode (como no main.tsx) a carga também não leva o foco ao <main>', () => {
  render(
    <StrictMode>
      <ProvedorDeLeitura>
        <RouterProvider router={createMemoryRouter(rotas, { initialEntries: ['/'] })} />
      </ProvedorDeLeitura>
    </StrictMode>,
  )

  expect(screen.getByRole('main')).not.toHaveFocus()
})
