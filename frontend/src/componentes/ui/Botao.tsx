import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { classes } from '../../compartilhado/classes'

/**
 * Botão do sistema. Mesma aparência para três naturezas diferentes:
 * `para` vira link interno (react-router), `href` vira link externo, e sem
 * nenhum dos dois é um <button>.
 *
 * - primario   marrom, a ação principal da tela (uma por tela)
 * - aplique    primário com sombra ocre: o destaque — no máximo um por tela
 * - secundario contorno marrom
 * - apoio      ocre: só para "Apoiar"/doar e CTA sobre fundo escuro
 */
export type VarianteDoBotao = 'primario' | 'aplique' | 'secundario' | 'apoio'

interface Comum {
  variante?: VarianteDoBotao
  tamanho?: 'normal' | 'compacto'
  larguraTotal?: boolean
  children: ReactNode
  className?: string
}

type ComoLinkInterno = Comum & { para: string; href?: never } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
type ComoLinkExterno = Comum & { href: string; para?: never } & AnchorHTMLAttributes<HTMLAnchorElement>
type ComoBotao = Comum & { para?: never; href?: never } & ButtonHTMLAttributes<HTMLButtonElement>

export type PropsDoBotao = ComoLinkInterno | ComoLinkExterno | ComoBotao

const BASE =
  'inline-flex items-center justify-center gap-2 px-5 text-center font-semibold no-underline ' +
  'border-[1.5px] border-marrom select-none cursor-pointer ' +
  'transition-[transform,box-shadow,background-color] duration-[90ms] ease-out ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60'

const VARIANTES: Record<VarianteDoBotao, string> = {
  primario: 'bg-marrom text-creme hover:text-creme active:scale-[.98]',
  aplique:
    'bg-marrom text-creme hover:text-creme shadow-aplique-ocre ' +
    'active:translate-x-[5px] active:translate-y-[5px] active:shadow-none',
  secundario: 'bg-transparent text-marrom hover:text-marrom active:bg-creme-escuro active:scale-[.98]',
  apoio: 'bg-ocre text-marrom hover:text-marrom font-bold active:scale-[.98]',
}

const TAMANHOS = {
  normal: 'min-h-13 text-corpo',
  compacto: 'min-h-11 px-3.5 text-secundario rounded-controle',
}

export function Botao(props: PropsDoBotao) {
  const { variante = 'primario', tamanho = 'normal', larguraTotal = false, className, children, ...resto } = props
  const estilo = classes(BASE, VARIANTES[variante], TAMANHOS[tamanho], larguraTotal && 'w-full', className)

  if ('para' in resto && resto.para !== undefined) {
    const { para, ...link } = resto as ComoLinkInterno
    return (
      <Link to={para} className={estilo} {...link}>
        {children}
      </Link>
    )
  }

  if ('href' in resto && resto.href !== undefined) {
    return (
      <a className={estilo} {...(resto as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }

  const { type = 'button', ...botao } = resto as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={estilo} {...botao}>
      {children}
    </button>
  )
}
