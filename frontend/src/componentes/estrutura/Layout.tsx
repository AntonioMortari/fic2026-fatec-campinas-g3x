import { useCallback, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { BarraInferior } from './BarraInferior'
import { Cabecalho } from './Cabecalho'
import { LinkDePular } from './LinkDePular'
import { Menu, type SecaoDoMenu } from './Menu'
import { Rodape } from './Rodape'
import { useFocoNaNavegacao } from './useFocoNaNavegacao'

/**
 * Moldura de toda página pública (Plano de Migração, F2; anatomia em
 * "Análise UX/UI · Fundamentos"): cabeçalho fixo, conteúdo, rodapé
 * compacto e, no celular, a barra inferior — que ocupa 72px, daí o
 * espaço reservado no fim da página.
 */
export function Layout() {
  const [menu, setMenu] = useState<{ aberto: boolean; secao: SecaoDoMenu }>({ aberto: false, secao: 'inicio' })
  const abrirMenu = useCallback((secao: SecaoDoMenu) => setMenu({ aberto: true, secao }), [])
  const fecharMenu = useCallback(() => setMenu((atual) => ({ ...atual, aberto: false })), [])
  useFocoNaNavegacao()

  return (
    <div className="flex min-h-dvh flex-col pb-[4.5rem] desktop:pb-0">
      <LinkDePular />
      <Cabecalho abrirMenu={abrirMenu} />
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-pagina flex-1 px-4 pb-12 outline-none desktop:px-8">
        <Outlet />
      </main>
      <Rodape />
      <BarraInferior abrirMenu={abrirMenu} menuAberto={menu.aberto} />
      <Menu aberto={menu.aberto} secao={menu.secao} aoFechar={fecharMenu} />
    </div>
  )
}
