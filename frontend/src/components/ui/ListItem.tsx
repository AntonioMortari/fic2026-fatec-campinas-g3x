import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '../../lib/cn'
import { Chevron } from './Chevron'

interface ListItemProps {
  title: string
  description?: ReactNode
  to: string
  number?: string
  tone?: 'ochre' | 'blue' | 'brown'
}

const TONES = {
  ochre: 'text-ochre-deep',
  blue: 'text-blue-deep',
  brown: 'text-brown-400',
}

export function ListItem({ title, description, to, number, tone = 'ochre' }: ListItemProps) {
  return (
    <li className="border-b border-line last:border-b-0">
      <Link
        to={to}
        className={cn(
          'grid min-h-18 items-center gap-2 py-3 text-brown no-underline hover:text-brown',
          number ? 'grid-cols-[2rem_1fr_1rem]' : 'grid-cols-[1fr_1rem]',
        )}
      >
        {number && (
          <span aria-hidden="true" className={cn('text-[0.8125rem] font-bold', TONES[tone])}>
            {number}
          </span>
        )}
        <span>
          <span className="block text-item font-bold">{title}</span>
          {description && <span className="block text-small text-brown-400">{description}</span>}
        </span>
        <Chevron />
      </Link>
    </li>
  )
}
