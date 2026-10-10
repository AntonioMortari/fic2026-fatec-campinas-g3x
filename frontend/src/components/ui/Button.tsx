import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'applique' | 'secondary' | 'support'

interface CommonProps {
  variant?: ButtonVariant
  loading?: boolean
  size?: 'default' | 'compact'
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

type InternalLinkProps = CommonProps & { to: string; href?: never } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>
type ExternalLinkProps = CommonProps & { href: string; to?: never } & AnchorHTMLAttributes<HTMLAnchorElement>
type NativeButtonProps = CommonProps & { to?: never; href?: never } & ButtonHTMLAttributes<HTMLButtonElement>

export type ButtonProps = InternalLinkProps | ExternalLinkProps | NativeButtonProps

const BASE =
  'inline-flex items-center justify-center gap-2 px-5 text-center font-semibold no-underline ' +
  'border-[1.5px] border-brown select-none cursor-pointer ' +
  'transition-[transform,box-shadow,background-color] duration-[90ms] ease-out ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brown text-cream hover:text-cream active:scale-[.98]',
  applique:
    'bg-brown text-cream hover:text-cream shadow-applique-ochre ' +
    'active:translate-x-1 active:translate-y-1 active:shadow-none',
  secondary: 'bg-transparent text-brown hover:text-brown active:bg-cream-dark active:scale-[.98]',
  support: 'bg-ochre text-brown hover:text-brown font-bold active:scale-[.98]',
}

const SIZES = {
  default: 'min-h-13 text-body',
  compact: 'min-h-11 px-3.5 text-small rounded-control',
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'default', fullWidth = false, loading = false, className, children, ...rest } = props
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', className)

  if ('to' in rest && rest.to !== undefined) {
    const { to, ...link } = rest as InternalLinkProps
    return (
      <Link to={to} className={classes} {...link}>
        {children}
      </Link>
    )
  }

  if ('href' in rest && rest.href !== undefined) {
    return (
      <a className={classes} {...(rest as AnchorHTMLAttributes<HTMLAnchorElement>)}>
        {children}
      </a>
    )
  }

  const { type = 'button', disabled, ...button } = rest as ButtonHTMLAttributes<HTMLButtonElement>
  return (
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} {...button}>
      {loading ? 'Enviando…' : children}
    </button>
  )
}
