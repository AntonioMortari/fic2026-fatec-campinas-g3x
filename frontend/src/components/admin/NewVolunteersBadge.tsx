import { useVolunteerCounts } from '../../services/admin-volunteers'

export function NewVolunteersBadge() {
  const { data } = useVolunteerCounts()
  if (!data || data.new === 0) return null

  return (
    <span className="ml-auto inline-grid h-4 min-w-6 place-items-center bg-ochre px-1 text-xs leading-none font-bold text-brown">
      {data.new}
      <span className="sr-only"> {data.new === 1 ? 'nova' : 'novas'}</span>
    </span>
  )
}
