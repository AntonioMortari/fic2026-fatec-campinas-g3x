import { cn } from '../../lib/cn'

const DIRECTIONS = {
  right: 'border-t-2 border-r-2',
  left: 'border-b-2 border-l-2',
  down: 'border-b-2 border-r-2 -translate-y-0.75',
  up: 'border-t-2 border-l-2 translate-y-0.75',
}

export function Chevron({ direction = 'right' }: { direction?: keyof typeof DIRECTIONS }) {
  return <span aria-hidden="true" className={cn('inline-block size-2.25 shrink-0 rotate-45 border-current', DIRECTIONS[direction])} />
}
