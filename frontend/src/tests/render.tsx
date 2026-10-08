import { render } from '@testing-library/react'
import type { ReactNode } from 'react'
import { RouterProvider, createMemoryRouter, type RouteObject } from 'react-router-dom'
import { ReadingPreferencesProvider } from '../contexts/ReadingPreferencesProvider'
import { routes } from '../routes'

export function renderRoute(path: string, routeObjects: RouteObject[] = routes) {
  const router = createMemoryRouter(routeObjects, { initialEntries: [path] })
  render(
    <ReadingPreferencesProvider>
      <RouterProvider router={router} />
    </ReadingPreferencesProvider>,
  )
  return router
}

export function renderWithRouter(element: ReactNode, path = '/') {
  return renderRoute(path, [{ path: '*', element }])
}
