import { Link } from 'react-router-dom'
import { Chevron } from './Chevron'

export function BackLink({ to, label }: { to: string; label: string }) {
  return (
    <Link
      to={to}
      className="-ml-3 inline-flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-brown"
    >
      <Chevron direction="left" />
      <span>
        <span className="sr-only">Voltar para</span> {label}
      </span>
    </Link>
  )
}
