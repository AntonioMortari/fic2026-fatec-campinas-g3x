import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Chevron } from './Chevron'

export function BackLink({ to, label, tone = 'ink' }: { to: string; label: string; tone?: 'ink' | 'link' }) {
  return (
    <Link
      to={to}
      className={cn(
        '-ml-3 inline-flex min-h-11 items-center gap-2 px-3 font-semibold no-underline',
        tone === 'link' ? 'text-[0.875rem] text-blue-deep hover:text-brown' : 'text-[0.9375rem] text-brown hover:text-blue-deep',
      )}
    >
      <Chevron direction="left" />
      <span>
        <span className="sr-only">Voltar para</span> {label}
      </span>
    </Link>
  )
}
