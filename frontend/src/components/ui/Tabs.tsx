import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'

export interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabsProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  label: string
}

export function Tabs({ tabs, activeId, onChange, label }: TabsProps) {
  const prefix = useId()
  const buttons = useRef<(HTMLButtonElement | null)[]>([])

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const current = tabs.findIndex((tab) => tab.id === activeId)
    const targets: Record<string, number> = {
      ArrowRight: (current + 1) % tabs.length,
      ArrowLeft: (current - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }
    const next = targets[event.key]
    if (next === undefined) return
    event.preventDefault()
    const tab = tabs[next]
    if (!tab) return
    onChange(tab.id)
    buttons.current[next]?.focus()
  }

  const activeTab = tabs.find((tab) => tab.id === activeId)

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={label}
        onKeyDown={handleKeyDown}
        className="grid overflow-hidden rounded-control border-[1.5px] border-brown"
        style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
      >
        {tabs.map((tab, index) => {
          const selected = tab.id === activeId
          return (
            <button
              key={tab.id}
              ref={(element) => {
                buttons.current[index] = element
              }}
              type="button"
              role="tab"
              id={`${prefix}-tab-${tab.id}`}
              aria-selected={selected}
              aria-controls={`${prefix}-panel-${tab.id}`}
              tabIndex={selected ? 0 : -1}
              onClick={() => onChange(tab.id)}
              className={cn(
                'min-h-11 cursor-pointer px-3 text-[0.9375rem] font-semibold transition-colors duration-[90ms]',
                selected ? 'bg-brown text-cream' : 'bg-transparent text-brown',
              )}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      {activeTab && (
        <div
          role="tabpanel"
          id={`${prefix}-panel-${activeTab.id}`}
          aria-labelledby={`${prefix}-tab-${activeTab.id}`}
          tabIndex={0}
          className="animate-rise"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  )
}
