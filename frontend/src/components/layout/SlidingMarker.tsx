interface SlidingMarkerProps {
  index: number
  count: number
  className?: string
}

export function SlidingMarker({ index, count, className = '-top-[1.5px]' }: SlidingMarkerProps) {
  return (
    <span
      aria-hidden="true"
      data-marker-index={index}
      className={`pointer-events-none absolute left-0 h-1 transition-[transform,opacity] duration-(--motion-change) ease-(--ease-motion) ${className}`}
      style={{ width: `${100 / count}%`, transform: `translateX(${Math.max(index, 0) * 100}%)`, opacity: index < 0 ? 0 : 1 }}
    >
      <span className="absolute inset-x-[22%] inset-y-0 bg-ochre" />
    </span>
  )
}
