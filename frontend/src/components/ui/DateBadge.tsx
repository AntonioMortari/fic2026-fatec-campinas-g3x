import { cn } from '../../lib/cn'
import { dateParts } from '../../lib/dates'

interface DateBadgeProps {
  date: Date
  highlight?: boolean
  size?: 'default' | 'large'
}

export function DateBadge({ date, highlight = false, size = 'default' }: DateBadgeProps) {
  const { weekday, day, month, spoken } = dateParts(date)
  return (
    <span
      className={cn(
        'flex flex-none flex-col items-center justify-center text-brown',
        highlight ? 'bg-ochre' : 'bg-cream-dark',
        size === 'large' ? 'h-24 w-21' : 'h-19 w-16',
      )}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="text-[0.6875rem] font-semibold tracking-[0.1em]">
        {weekday}
      </span>
      <span aria-hidden="true" className={cn('leading-none font-bold', size === 'large' ? 'text-[2.125rem]' : 'text-[1.625rem]')}>
        {day}
      </span>
      <span aria-hidden="true" className="text-[0.6875rem] font-semibold tracking-[0.1em]">
        {month}
      </span>
    </span>
  )
}
