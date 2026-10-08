import { Link, useLocation } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'
import { APOIAR, NAVEGACAO_DESKTOP, rotaAtiva } from '../../compartilhado/navegacao'
import { Seta } from '../ui/ItemDeLista'
import { Logotipo } from './Logotipo'
import type { AbrirMenu } from './Menu'

/**
 * Cabeçalho (Análise UX/UI, 2a e 6a). Creme — o ocre saiu do fundo.
 * Celular: 60px com logotipo, "Aa" e "Entrar"; a navegação mora na barra
 * inferior. Desktop: 76px com a navegação principal, "Mais" (abre o mesmo
 * menu do celular), "Aa", "Entrar" e "Apoiar" sempre em destaque.
 */
const CONTROLE =
  'min-h-11 items-center justify-center rounded-controle border-[1.5px] border-marrom font-semibold text-marrom no-underline hover:text-marrom cursor-pointer'

export function Cabecalho({ abrirMenu }: { abrirMenu: AbrirMenu }) {
  const { pathname } = useLocation()

  return (
    <header className="sticky top-0 z-30 border-b border-linha bg-creme">
      <div className="mx-auto flex h-15 max-w-pagina items-center gap-2.5 px-4 desktop:h-19 desktop:gap-8 desktop:px-8">
        <Logotipo className="min-w-0 desktop:h-11" />

        <nav aria-label="Principal" className="hidden flex-1 desktop:block">
          <ul className="m-0 flex list-none gap-1 p-0">
            {NAVEGACAO_DESKTOP.map((destino) => {
              const ativo = rotaAtiva(destino.para, pathname)
              return (
                <li key={destino.para}>
                  <Link
                    to={destino.para}
                    aria-current={ativo ? 'page' : undefined}
                    className={classes(
                      'relative flex min-h-11 items-center px-3.5 text-[0.9375rem] no-underline hover:text-marrom',
                      ativo ? 'font-bold text-marrom' : 'font-semibold text-marrom-600',
                    )}
                  >
                    {ativo && <span aria-hidden="true" className="absolute inset-x-3.5 bottom-1 h-0.75 bg-ocre" />}
                    {destino.rotulo}
                  </Link>
                </li>
              )
            })}
            <li>
              <button
                type="button"
                onClick={() => abrirMenu('inicio')}
                className="flex min-h-11 cursor-pointer items-center gap-2 bg-transparent px-3.5 text-[0.9375rem] font-semibold text-marrom-600"
              >
                Mais <Seta direcao="baixo" />
              </button>
            </li>
          </ul>
        </nav>

        <span className="flex-1 desktop:hidden" />

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            aria-label="Aa, acessibilidade: tamanho do texto e contraste"
            onClick={() => abrirMenu('leitura')}
            className={classes(CONTROLE, 'inline-flex w-11 bg-transparent text-[0.9375rem] font-bold')}
          >
            Aa
          </button>
          <Link to="/entrar" className={classes(CONTROLE, 'inline-flex px-3.5 text-secundario whitespace-nowrap desktop:px-4 desktop:text-[0.9375rem]')}>
            Entrar
          </Link>
          <Link
            to={APOIAR.para}
            className={classes(CONTROLE, 'hidden bg-ocre px-4.5 text-[0.9375rem] font-bold desktop:inline-flex')}
          >
            {APOIAR.rotulo}
          </Link>
        </div>
      </div>
    </header>
  )
}
