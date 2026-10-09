import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { ReadingPreferencesProvider } from '../contexts/ReadingPreferencesProvider'
import { routes } from '../routes'

export function renderRoute(path: string, routeObjects: RouteObject[] = routes) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  render(
    <ReadingPreferencesProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </ReadingPreferencesProvider>,
  )
  return router
}

export function renderWithRouter(element: ReactNode, path = '/') {
  return renderRoute(path, [{ path: '*', element }])
}
