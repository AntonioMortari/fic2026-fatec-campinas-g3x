import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { cn } from '../../lib/cn'
import { panelId, tabId } from './tab-ids'

export interface Tab {
  id: string
  label: string
  content: ReactNode
}

interface TabListProps {
  tabs: Pick<Tab, 'id' | 'label'>[]
  activeId: string
  onChange: (id: string) => void
  label: string
  prefix: string
  className?: string
}

export function TabList({ tabs, activeId, onChange, label, prefix, className }: TabListProps) {
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

  return (
    <div
      role="tablist"
      aria-label={label}
      onKeyDown={handleKeyDown}
      className={cn('grid overflow-hidden rounded-control border border-brown bg-cream', className)}
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
            id={tabId(prefix, tab.id)}
            aria-selected={selected}
            aria-controls={panelId(prefix, tab.id)}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cn(
              'min-h-11.5 cursor-pointer px-3 text-[0.9375rem] font-semibold transition-colors duration-[90ms]',
              selected ? 'bg-brown text-cream' : 'bg-transparent text-brown',
            )}
          >
            {tab.label}
          </button>
        )
      })}
    </div>
  )
}

interface TabsProps {
  tabs: Tab[]
  activeId: string
  onChange: (id: string) => void
  label: string
}

export function Tabs({ tabs, activeId, onChange, label }: TabsProps) {
  const prefix = useId()
  const activeTab = tabs.find((tab) => tab.id === activeId)

  return (
    <div className="flex flex-col gap-4.5">
      <TabList tabs={tabs} activeId={activeId} onChange={onChange} label={label} prefix={prefix} />
      {activeTab && (
        <div
          role="tabpanel"
          id={panelId(prefix, activeTab.id)}
          aria-labelledby={tabId(prefix, activeTab.id)}
          tabIndex={0}
          className="animate-rise"
        >
          {activeTab.content}
        </div>
      )}
    </div>
  )
}
