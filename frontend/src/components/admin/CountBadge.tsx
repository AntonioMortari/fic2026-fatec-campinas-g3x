export function CountBadge({ count }: { count: number | undefined }) {
  if (!count) return null

  return (
    <span className="ml-auto inline-grid h-4 min-w-6 place-items-center bg-ochre px-1 text-xs leading-none font-bold text-brown">
      {count}
      <span className="sr-only"> {count === 1 ? 'nova' : 'novas'}</span>
    </span>
  )
}
