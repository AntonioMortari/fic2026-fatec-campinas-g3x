import { MAX_FONT_STEP, MIN_FONT_STEP } from '../../contexts/reading-context'
import { useReadingPreferences } from '../../contexts/useReadingPreferences'
import { cn } from '../../lib/cn'

const BUTTON = 'grid min-h-11 cursor-pointer place-items-center rounded-control border-[1.5px] border-brown px-2 text-small font-semibold'

export function ReadingControls() {
  const reading = useReadingPreferences()

  return (
    <div role="group" aria-label="Tamanho do texto e contraste" className="grid grid-cols-[repeat(3,1fr)_1.6fr] gap-2">
      <button
        type="button"
        aria-label="A−, diminuir o texto"
        disabled={reading.fontStep <= MIN_FONT_STEP}
        onClick={reading.decreaseFont}
        className={cn(BUTTON, 'bg-transparent disabled:opacity-50')}
      >
        A−
      </button>
      <button
        type="button"
        aria-label="A, texto no tamanho normal"
        aria-pressed={reading.fontStep === 0}
        onClick={reading.resetFont}
        className={cn(BUTTON, reading.fontStep === 0 ? 'bg-brown text-cream' : 'bg-transparent')}
      >
        A
      </button>
      <button
        type="button"
        aria-label="A+, aumentar o texto"
        disabled={reading.fontStep >= MAX_FONT_STEP}
        onClick={reading.increaseFont}
        className={cn(BUTTON, 'bg-transparent disabled:opacity-50')}
      >
        A+
      </button>
      <button
        type="button"
        aria-pressed={reading.highContrast}
        onClick={reading.toggleContrast}
        className={cn(BUTTON, reading.highContrast ? 'bg-brown text-cream' : 'bg-transparent')}
      >
        {reading.highContrast && <span aria-hidden="true">✓ </span>}Alto contraste
      </button>
    </div>
  )
}
