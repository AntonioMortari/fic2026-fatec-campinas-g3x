import { cn } from '../../lib/cn'

export interface ChipOption {
  value: string
  label: string
  count?: number
}

interface ChipFilterProps {
  options: ChipOption[]
  selected: string
  onSelect: (value: string) => void
  label: string
  listOnDesktop?: boolean
}

export function ChipFilter({ options, selected, onSelect, label, listOnDesktop = false }: ChipFilterProps) {
  return (
    <div
      role="group"
      aria-label={label}
      className={cn('flex gap-2 overflow-x-auto pb-1 desktop:flex-wrap', listOnDesktop && 'desktop:flex-col desktop:flex-nowrap desktop:gap-1 desktop:overflow-visible desktop:pb-0')}
    >
      {options.map((option) => {
        const active = option.value === selected
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={active}
            onClick={() => onSelect(option.value)}
            className={cn(
              'inline-flex min-h-11 flex-none cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-brown px-3.5 text-small font-semibold',
              active ? 'bg-brown text-cream' : 'bg-card text-brown',
              listOnDesktop && 'desktop:min-h-11 desktop:w-full desktop:justify-between desktop:rounded-none desktop:border-0 desktop:px-3 desktop:text-[0.9375rem] desktop:font-semibold',
              listOnDesktop && !active && 'desktop:bg-transparent',
            )}
          >
            {option.label}
            {option.count !== undefined && ' '}
            {option.count !== undefined && (
              <span className={cn('text-[0.8125rem] desktop:text-[0.9375rem] desktop:font-normal', active ? 'text-cream-dim' : 'text-brown-400')}>{option.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
