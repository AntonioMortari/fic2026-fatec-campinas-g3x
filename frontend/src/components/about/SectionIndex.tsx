import { cn } from '../../lib/cn'
import { useActiveSection } from './useActiveSection'

const ABOUT_SECTIONS = [
  { id: 'sankofa', label: 'Sankofa' },
  { id: 'quem-idealizou', label: 'Quem idealizou' },
  { id: 'setores', label: 'Setores' },
  { id: 'para-quem', label: 'Para quem' },
  { id: 'onde-estamos', label: 'Onde estamos' },
] as const

const SECTION_IDS = ABOUT_SECTIONS.map((section) => section.id)

// On the phone it is the bar that sticks under the header and marks the section on screen (15b); on the desktop it is plain chips
// under the opening sentence (15a). The section on screen still gets aria-current in both.
export function SectionIndex({ variant }: { variant: 'bar' | 'chips' }) {
  const active = useActiveSection(SECTION_IDS)
  const bar = variant === 'bar'
  return (
    <nav
      aria-label="Nesta página"
      className={cn(bar ? 'sticky top-15 z-20 flex gap-2 overflow-x-auto border-b border-brown/15 bg-cream px-4 pt-5 pb-3' : 'flex flex-wrap gap-2 border-t-[1.5px] border-brown pt-4.5')}
    >
      {ABOUT_SECTIONS.map((section) => {
        const current = section.id === active
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={current ? 'location' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center rounded-full border-[1.5px] border-brown text-brown no-underline hover:text-brown',
              bar ? 'px-3.5 text-small font-semibold' : 'px-4 text-[0.9375rem] font-semibold',
              bar && current ? 'bg-brown text-cream hover:text-cream' : 'bg-transparent',
            )}
          >
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}
