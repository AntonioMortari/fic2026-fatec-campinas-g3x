import { Link } from 'react-router-dom'
import { Chevron } from '../ui'

// The bar the gallery screens draw on the phone (designs 11k, 11l, 11m): a way back on the left, "Equipe" on the right.
export function AdminBackBar({ to, label }: { to: string; label: string }) {
  return (
    <div className="flex h-15 items-center justify-between border-b border-line pr-2 pl-1 desktop:hidden">
      <Link to={to} className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
        <Chevron direction="left" />
        <span>
          <span className="sr-only">Voltar para</span> {label}
        </span>
      </Link>
      <span className="mr-2 border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold tracking-[0.1em] uppercase">Equipe</span>
    </div>
  )
}
