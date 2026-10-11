import { cn } from '../../lib/cn'
import { useActiveSection } from './useActiveSection'

const ABOUT_SECTIONS = [
  { id: 'sankofa', label: 'Sankofa' },
  { id: 'quem-idealizou', label: 'Quem idealizou' },
  { id: 'setores', label: 'Setores' },
  { id: 'onde-estamos', label: 'Onde estamos' },
] as const

const SECTION_IDS = ABOUT_SECTIONS.map((section) => section.id)

export function SectionIndex() {
  const active = useActiveSection(SECTION_IDS)
  return (
    <nav aria-label="Nesta página" className="sticky top-15 z-20 desktop:top-19 flex gap-2 overflow-x-auto bg-cream px-4 pt-5 pb-3 desktop:justify-center">
      {ABOUT_SECTIONS.map((section) => {
        const current = section.id === active
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={current ? 'location' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center rounded-full border-[1.5px] border-brown px-3.5 text-small font-semibold no-underline',
              current ? 'bg-brown text-cream hover:text-cream' : 'bg-transparent text-brown hover:text-brown',
            )}
          >
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}
