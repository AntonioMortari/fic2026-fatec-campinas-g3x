import { Link, useLocation } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'
import { APOIAR, BARRA_INFERIOR, rotaAtiva } from '../../compartilhado/navegacao'
import type { AbrirMenu } from './Menu'

/**
 * Barra inferior do celular (Análise UX/UI, 2a): a navegação ao alcance do
 * polegar, com "Apoiar" — a ação mais importante para a ONG — sempre
 * visível. Some no desktop, onde a navegação está no cabeçalho.
 */
/*
 * Os rótulos da barra crescem com o A+ só até 15px: são cinco colunas em
 * 320–430px, e a 137,5% "Projetos" encostava em "Apoiar". O conteúdo da
 * página continua crescendo inteiro; a barra é moldura, e os mesmos destinos
 * estão no menu, em 17px que crescem sem teto.
 */
const ITEM = 'relative flex min-h-14 items-center justify-center text-[min(0.8125rem,15px)] no-underline'

export function BarraInferior({ abrirMenu, menuAberto }: { abrirMenu: AbrirMenu; menuAberto: boolean }) {
  const { pathname } = useLocation()

  return (
    <nav
      aria-label="Atalhos"
      className="area-segura-inferior fixed inset-x-0 bottom-0 z-30 border-t-[1.5px] border-marrom bg-cartao px-1.5 desktop:hidden"
    >
      <ul className="m-0 grid list-none grid-cols-5 p-0">
        {BARRA_INFERIOR.map((destino) => {
          const ativo = !menuAberto && rotaAtiva(destino.para, pathname)
          return (
            <li key={destino.para}>
              <Link
                to={destino.para}
                aria-current={ativo ? 'page' : undefined}
                className={classes(ITEM, ativo ? 'font-bold text-marrom' : 'font-semibold text-marrom-400', 'hover:text-marrom')}
              >
                {ativo && <Marcador />}
                {destino.rotulo}
              </Link>
            </li>
          )
        })}
        <li>
          <Link to={APOIAR.para} aria-current={rotaAtiva(APOIAR.para, pathname) ? 'page' : undefined} className={ITEM}>
            <span className="rounded-controle bg-ocre px-2 py-1.75 font-bold text-marrom">{APOIAR.rotulo}</span>
          </Link>
        </li>
        <li>
          <button
            type="button"
            aria-expanded={menuAberto}
            onClick={() => abrirMenu('inicio')}
            className={classes(ITEM, 'w-full cursor-pointer bg-transparent', menuAberto ? 'font-bold text-marrom' : 'font-semibold text-marrom-400')}
          >
            {menuAberto && <Marcador />}
            Menu
          </button>
        </li>
      </ul>
    </nav>
  )
}

function Marcador() {
  return <span aria-hidden="true" className="absolute inset-x-[22%] -top-[1.5px] h-1 bg-ocre" />
}
