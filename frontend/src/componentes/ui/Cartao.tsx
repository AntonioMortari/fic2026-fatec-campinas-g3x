import type { HTMLAttributes } from 'react'
import { classes } from '../../compartilhado/classes'

/**
 * Elevação em 3 níveis (Análise UX/UI, "Fundamentos"):
 * - plano     listas, cartões comuns, campos — linha leve, sem sombra
 * - contorno  seleção, foco, o que precisa se separar — 1,5px marrom
 * - aplique   o destaque da tela — contorno + sombra dura. NO MÁXIMO UM POR TELA:
 *             sombra em tudo foi o que deixou o site antigo com ar amador.
 */
export type NivelDeElevacao = 'plano' | 'contorno' | 'aplique'

const NIVEIS: Record<NivelDeElevacao, string> = {
  plano: 'border border-linha',
  contorno: 'border-[1.5px] border-marrom',
  aplique: 'border-[1.5px] border-marrom shadow-aplique',
}

interface Props extends HTMLAttributes<HTMLElement> {
  nivel?: NivelDeElevacao
  como?: 'article' | 'section' | 'div' | 'li'
}

export function Cartao({ nivel = 'plano', como: Elemento = 'div', className, ...resto }: Props) {
  return <Elemento className={classes('bg-cartao', NIVEIS[nivel], className)} {...resto} />
}
