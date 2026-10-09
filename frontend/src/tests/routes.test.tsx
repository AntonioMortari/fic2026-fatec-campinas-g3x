import { act, render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthProvider'
import { ReadingPreferencesProvider } from '../contexts/ReadingPreferencesProvider'
import { routes } from '../routes'
import { renderRoute } from './render'

describe('routes (RNF-FE-04)', () => {
  it('the home page has a single main heading', () => {
    renderRoute('/')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arte, memória e pertencimento')
  })

  it('an unknown path shows the not found page with a way back', () => {
    renderRoute('/unknown-path')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  })

  it('content lives in the <main> targeted by the skip link', () => {
    renderRoute('/')

    expect(screen.getByRole('main')).toHaveAttribute('id', 'content')
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#content')
  })
})

describe('focus on navigation', () => {
  it('does not steal focus on load, but moves it to <main> when the route changes', async () => {
    const router = renderRoute('/')
    expect(screen.getByRole('main')).not.toHaveFocus()

    await act(() => router.navigate('/another-page'))

    expect(screen.getByRole('main')).toHaveFocus()
  })

  it('does not steal focus on load under StrictMode, as in main.tsx', () => {
    render(
      <StrictMode>
        <ReadingPreferencesProvider>
          <QueryClientProvider client={new QueryClient()}>
            <AuthProvider>
              <RouterProvider router={createMemoryRouter(routes, { initialEntries: ['/'] })} />
            </AuthProvider>
          </QueryClientProvider>
        </ReadingPreferencesProvider>
      </StrictMode>,
    )

    expect(screen.getByRole('main')).not.toHaveFocus()
  })
})
