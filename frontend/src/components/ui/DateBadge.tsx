import { cn } from '../../lib/cn'
import { dateParts } from '../../lib/dates'

type Size = 'default' | 'large' | 'row' | 'feature' | 'next' | 'compact' | 'panel'

interface DateBadgeProps {
  date: Date
  highlight?: boolean
  size?: Size
}

// "row" and "feature" are the agenda's: the same badge on the phone, and a bigger one beside the title on the desktop.
const BOX: Record<Size, string> = {
  default: 'h-19 w-16',
  compact: 'h-14.5 w-13',
  panel: 'size-14 desktop:size-16',
  large: 'h-24 w-21',
  row: 'h-19 w-16 desktop:h-21 desktop:w-20',
  feature: 'h-19 w-16 desktop:h-23 desktop:w-20',
  next: 'h-17.5 w-16 desktop:h-24 desktop:w-21',
}
const NUMBER: Record<Size, string> = {
  default: 'text-[1.625rem]',
  compact: 'text-[1.375rem]',
  panel: 'text-[1.375rem] desktop:text-2xl',
  large: 'text-[2.125rem]',
  row: 'text-[1.625rem] desktop:text-[1.875rem]',
  feature: 'text-[1.625rem] desktop:text-[2rem]',
  next: 'text-[1.625rem] desktop:text-[2.125rem]',
}
const LABEL: Record<Size, string> = {
  default: 'text-[0.6875rem]',
  compact: 'text-[0.625rem]',
  panel: 'text-[0.625rem] desktop:text-[0.6875rem]',
  large: 'text-[0.6875rem] desktop:text-xs',
  row: 'text-[0.6875rem] desktop:text-xs',
  feature: 'text-[0.6875rem] desktop:text-xs',
  next: 'text-[0.6875rem] desktop:text-xs',
}

export function DateBadge({ date, highlight = false, size = 'default' }: DateBadgeProps) {
  const { weekday, day, month, spoken } = dateParts(date)
  return (
    <span className={cn('flex flex-none flex-col items-center justify-center text-brown', highlight ? 'bg-ochre' : 'bg-cream-dark', BOX[size])}>
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className={cn('tracking-[0.1em]', size === 'panel' ? 'font-bold' : 'font-semibold', LABEL[size])}>
        {weekday}
      </span>
      <span aria-hidden="true" className={cn('leading-none font-bold', NUMBER[size])}>
        {day}
      </span>
      <span aria-hidden="true" className={cn('tracking-[0.1em]', size === 'panel' ? 'font-bold' : 'font-semibold', LABEL[size])}>
        {month}
      </span>
    </span>
  )
}
