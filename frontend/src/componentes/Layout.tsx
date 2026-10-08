import { Outlet } from 'react-router-dom'

/**
 * Moldura de todas as páginas. Cabeçalho, navegação, barra de
 * acessibilidade e rodapé entram aqui no PR do design system.
 */
export function Layout() {
  return (
    <main id="conteudo">
      <Outlet />
    </main>
  )
}
