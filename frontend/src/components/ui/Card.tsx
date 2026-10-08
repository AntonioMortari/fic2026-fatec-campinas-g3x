import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

export type Elevation = 'flat' | 'outline' | 'applique'

const ELEVATIONS: Record<Elevation, string> = {
  flat: 'border border-line',
  outline: 'border-[1.5px] border-brown',
  applique: 'border-[1.5px] border-brown shadow-applique',
}

interface CardProps extends HTMLAttributes<HTMLElement> {
  elevation?: Elevation
  as?: 'article' | 'section' | 'div' | 'li'
}

export function Card({ elevation = 'flat', as: Element = 'div', className, ...rest }: CardProps) {
  return <Element className={cn('bg-card', ELEVATIONS[elevation], className)} {...rest} />
}
