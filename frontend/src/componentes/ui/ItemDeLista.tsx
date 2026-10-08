import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'

/**
 * Linha de lista navegável (Análise UX/UI, 2a "Por onde começar"): alvo de
 * 72px, título e uma linha de apoio, número opcional colorido pela
 * categoria e a seta à direita. A linha inteira é o link.
 */
interface Props {
  titulo: string
  descricao?: ReactNode
  para: string
  numero?: string
  /** Cor do número = a categoria do caminho. */
  tom?: 'ocre' | 'azul' | 'marrom'
}

const TONS = {
  ocre: 'text-ocre-escuro',
  azul: 'text-azul-escuro',
  marrom: 'text-marrom-400',
}

export function ItemDeLista({ titulo, descricao, para, numero, tom = 'ocre' }: Props) {
  return (
    <li className="border-b border-linha last:border-b-0">
      <Link
        to={para}
        className={classes(
          'grid min-h-18 items-center gap-2 py-3 text-marrom no-underline hover:text-marrom',
          numero ? 'grid-cols-[2rem_1fr_1rem]' : 'grid-cols-[1fr_1rem]',
        )}
      >
        {numero && (
          <span aria-hidden="true" className={classes('text-[0.8125rem] font-bold', TONS[tom])}>
            {numero}
          </span>
        )}
        <span>
          <span className="block text-item font-bold">{titulo}</span>
          {descricao && <span className="block text-secundario text-marrom-400">{descricao}</span>}
        </span>
        <Seta />
      </Link>
    </li>
  )
}

/** Seta desenhada com borda (não um caractere, que muda conforme a fonte do aparelho). */
export function Seta({ direcao = 'direita' }: { direcao?: 'direita' | 'esquerda' | 'baixo' }) {
  const giro = { direita: 'rotate-45 border-t-2 border-r-2', esquerda: 'rotate-45 border-b-2 border-l-2', baixo: 'rotate-45 border-b-2 border-r-2' }
  return <span aria-hidden="true" className={classes('inline-block size-2.25 shrink-0 border-current', giro[direcao])} />
}
