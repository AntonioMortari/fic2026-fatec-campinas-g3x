import { cn } from '../../lib/cn'

export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn('animate-skeleton-pulse bg-skeleton', className)} />
}

type Shape = 'cards' | 'rows' | 'lines' | 'block'

const SHAPES: Record<Shape, (index: number) => React.ReactNode> = {
  cards: (index) => (
    <div key={index} aria-hidden="true" className="flex gap-3.5 border-[1.5px] border-line p-4">
      <Skeleton className="h-16 w-14 shrink-0" />
      <div className="flex min-w-0 flex-1 flex-col gap-2.5">
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="h-5 w-4/5" />
        <Skeleton className="h-3.5 w-3/5" />
        <Skeleton className="mt-1 h-11 w-full" />
      </div>
    </div>
  ),
  rows: (index) => (
    <div key={index} aria-hidden="true" className="flex min-h-17 items-center gap-3 border-b border-line py-2">
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-3 w-2/5" />
      </div>
      <Skeleton className="h-8 w-16 shrink-0" />
    </div>
  ),
  lines: (index) => <Skeleton key={index} className={cn('h-4', index % 2 === 0 ? 'w-full' : 'w-4/5')} />,
  block: (index) => <Skeleton key={index} className="h-28 w-full" />,
}

interface LoadingStateProps {
  label: string
  children?: React.ReactNode
  shape?: Shape
  count?: number
  className?: string
}

export function LoadingState({ label, children, shape = 'lines', count = 3, className }: LoadingStateProps) {
  return (
    <div role="status" aria-busy="true" className={cn('relative flex animate-skeleton-in flex-col', shape === 'cards' ? 'gap-3.5' : shape === 'rows' ? 'gap-0' : 'gap-3', className)}>
      <span className="sr-only">{label}</span>
      <span aria-hidden="true" data-loading-thread className="weave-thread absolute inset-x-0 top-0 h-[3px] animate-weave" />
      {children ?? Array.from({ length: count }, (_, index) => SHAPES[shape](index))}
    </div>
  )
}
