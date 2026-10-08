import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Num site de página única, trocar de rota não recarrega a página: sem isto
 * o foco ficaria no link clicado e o leitor de tela não anunciaria nada.
 * Quando o caminho MUDA, o foco vai para o <main>, que começa pelo título
 * da página nova.
 *
 * Compara com o caminho anterior em vez de usar uma trava de "primeira vez":
 * o StrictMode roda o efeito duas vezes na carga, e a trava deixava a
 * segunda passar — o foco saltava para o <main> antes do "Pular para o
 * conteúdo", na página recém-aberta.
 */
export function useFocoNaNavegacao() {
  const { pathname } = useLocation()
  const anterior = useRef(pathname)

  useEffect(() => {
    if (anterior.current === pathname) return
    anterior.current = pathname
    document.getElementById('conteudo')?.focus()
    window.scrollTo(0, 0)
  }, [pathname])
}
