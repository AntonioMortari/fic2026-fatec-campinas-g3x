import { useReadingPreferences } from '../../contexts/useReadingPreferences'
import { cn } from '../../lib/cn'

// The same choice as "reduce motion" in the device settings, for someone who cannot change those (round 22).
export function MotionToggle({ className }: { className?: string }) {
  const { reducedMotion, toggleMotion } = useReadingPreferences()

  return (
    <button
      type="button"
      aria-pressed={reducedMotion}
      onClick={toggleMotion}
      className={cn(
        'grid min-h-11 w-full cursor-pointer place-items-center rounded-control border-[1.5px] border-brown px-2 text-small font-semibold',
        reducedMotion ? 'bg-brown text-cream' : 'bg-transparent',
        className,
      )}
    >
      {reducedMotion && <span aria-hidden="true">✓ </span>}Reduzir movimento
    </button>
  )
}
