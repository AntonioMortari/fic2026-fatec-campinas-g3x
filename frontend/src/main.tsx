import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { ProvedorDeLeitura } from './contextos/PreferenciasDeLeitura'
import { rotas } from './rotas'
import { criarClienteDeConsultas } from './servicos/consultas'
import './estilos.css'

const roteador = createBrowserRouter(rotas)
const clienteDeConsultas = criarClienteDeConsultas()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ProvedorDeLeitura>
      <QueryClientProvider client={clienteDeConsultas}>
        <RouterProvider router={roteador} />
      </QueryClientProvider>
    </ProvedorDeLeitura>
  </StrictMode>,
)
