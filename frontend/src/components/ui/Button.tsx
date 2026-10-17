import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'

export type ButtonVariant = 'primary' | 'applique' | 'secondary' | 'support'

interface CommonProps {
  variant?: ButtonVariant
  loading?: boolean
  done?: boolean
  doneLabel?: string
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
  'relative inline-flex items-center justify-center gap-2 px-5 text-center font-semibold no-underline ' +
  'border-[1.5px] border-brown select-none cursor-pointer ' +
  'transition-[transform,box-shadow,background-color,filter] duration-(--motion-change) ease-out active:duration-(--motion-touch) ' +
  'disabled:cursor-not-allowed disabled:opacity-60 aria-disabled:opacity-60'

const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-brown text-cream hover:text-cream not-disabled:hover:-translate-y-px not-disabled:hover:bg-brown-800 active:scale-[.98]',
  applique:
    'bg-brown text-cream hover:text-cream shadow-applique-ochre ' +
    'not-disabled:hover:-translate-x-0.5 not-disabled:hover:-translate-y-0.5 not-disabled:hover:shadow-[6px_6px_0_var(--color-ochre)] ' +
    'active:translate-x-1 active:translate-y-1 active:shadow-none',
  secondary: 'bg-transparent text-brown hover:text-brown not-disabled:hover:bg-hover active:bg-cream-dark active:scale-[.98]',
  support: 'bg-ochre text-brown hover:text-brown font-bold not-disabled:hover:-translate-y-px not-disabled:hover:brightness-95 active:scale-[.98]',
}

const DONE = 'bg-ochre text-brown hover:text-brown not-disabled:hover:bg-ochre shadow-none'

const SIZES = {
  default: 'min-h-13 text-body',
  compact: 'min-h-11 px-3.5 text-small rounded-control',
}

export function Button(props: ButtonProps) {
  const { variant = 'primary', size = 'default', fullWidth = false, loading = false, done = false, doneLabel, className, children, ...rest } = props
  const classes = cn(BASE, VARIANTS[variant], SIZES[size], fullWidth && 'w-full', done && DONE, className)

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
    <button type={type} className={classes} disabled={disabled || loading} aria-busy={loading || undefined} data-done={done || undefined} {...button}>
      {loading ? (
        <>
          <span className="inline-grid">
            <span aria-hidden="true" className="invisible col-start-1 row-start-1">
              {children}
            </span>
            <span className="col-start-1 row-start-1 inline-flex items-center justify-center gap-2">Enviando…</span>
          </span>
          <span aria-hidden="true" className="weave-thread absolute inset-x-0 bottom-0 h-[3px] animate-weave" />
        </>
      ) : done ? (
        <span className="inline-flex items-center justify-center gap-2">
          <span aria-hidden="true" className="mb-0.5 block h-2.5 w-4 -rotate-45 border-b-[2.5px] border-l-[2.5px] border-current" />
          {doneLabel ?? children}
        </span>
      ) : (
        children
      )}
    </button>
  )
}
