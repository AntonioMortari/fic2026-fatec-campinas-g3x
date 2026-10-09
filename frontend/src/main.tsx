import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthProvider'
import { ReadingPreferencesProvider } from './contexts/ReadingPreferencesProvider'
import { routes } from './routes'
import { createQueryClient } from './services/query-client'
import './styles.css'

const router = createBrowserRouter(routes)
const queryClient = createQueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ReadingPreferencesProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ReadingPreferencesProvider>
  </StrictMode>,
)
