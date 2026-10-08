import { Link, Outlet, useSearchParams } from 'react-router-dom'
import { destinoSeguro } from '../../compartilhado/destino'
import { Seta } from '../ui/ItemDeLista'
import { LinkDePular } from './LinkDePular'
import { useFocoNaNavegacao } from './useFocoNaNavegacao'

/**
 * Layout focado (Análise UX/UI, 3f; Plano de Migração, F2.6) para entrar,
 * recuperar acesso e nova senha: sem barra inferior e sem rodapé, só
 * "Voltar" — para onde a pessoa estava, pelo `?voltar=`.
 */
export function LayoutFocado() {
  const [busca] = useSearchParams()
  const voltar = destinoSeguro(busca.get('voltar'))
  useFocoNaNavegacao()

  return (
    <div className="flex min-h-dvh flex-col">
      <LinkDePular />
      <header className="border-b border-linha">
        <div className="mx-auto flex h-15 max-w-xl items-center px-1">
          <Link
            to={voltar}
            className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-marrom no-underline hover:text-marrom"
          >
            <Seta direcao="esquerda" />
            Voltar
          </Link>
        </div>
      </header>
      <main id="conteudo" tabIndex={-1} className="mx-auto w-full max-w-xl flex-1 px-4 pt-7 pb-10 outline-none">
        <Outlet />
      </main>
    </div>
  )
}
