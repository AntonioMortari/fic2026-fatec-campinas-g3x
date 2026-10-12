import type { AdminDestination } from '../../lib/admin-navigation'
import { NewContactsBadge } from './NewContactsBadge'
import { NewVolunteersBadge } from './NewVolunteersBadge'

export function DestinationBadge({ badge }: { badge: AdminDestination['badge'] }) {
  if (badge === 'new-volunteers') return <NewVolunteersBadge />
  if (badge === 'new-contacts') return <NewContactsBadge />
  return null
}
