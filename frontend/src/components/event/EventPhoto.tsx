import { cn } from '../../lib/cn'
import { imageSrc } from '../../services/events'
import type { EventImage } from '../../types/event'

export function EventPhoto({ image, faded, className }: { image: EventImage; faded: boolean; className?: string }) {
  return (
    <img
      src={imageSrc(image.url)}
      alt={image.alt}
      className={cn('block aspect-video object-cover desktop:aspect-[2/1] desktop:shadow-[8px_8px_0_var(--color-ochre)]', faded && '[filter:sepia(.6)_saturate(.7)]', className)}
    />
  )
}
