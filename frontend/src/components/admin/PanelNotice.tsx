import { cn } from '../../lib/cn'

// The line of feedback under a panel title (design 11j): what just happened, with a square marker.
export function PanelNotice({ children, tone = 'done' }: { children: string; tone?: 'done' | 'error' }) {
  return (
    <div
      role={tone === 'error' ? 'alert' : 'status'}
      className={cn('flex items-start gap-2.5 border-[1.5px] bg-card px-3.5 py-2.5 text-[0.90625rem] leading-[1.45] font-semibold', tone === 'error' ? 'border-error text-error' : 'border-brown text-brown')}
    >
      <span aria-hidden="true" className={cn('mt-[0.4em] size-2.5 shrink-0', tone === 'error' ? 'bg-error' : 'bg-brown')} />
      {children}
    </div>
  )
}
