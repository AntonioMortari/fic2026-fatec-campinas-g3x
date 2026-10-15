import type { HTMLAttributes } from 'react'
import { cn } from '../../lib/cn'

interface ContainerProps extends HTMLAttributes<HTMLElement> {
  as?: 'div' | 'section'
}

export function Container({ as: Element = 'div', className, ...rest }: ContainerProps) {
  return <Element className={cn('mx-auto w-full max-w-page px-4 desktop:px-8', className)} {...rest} />
}
