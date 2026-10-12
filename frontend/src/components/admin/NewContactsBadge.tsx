import { useContactCounts } from '../../services/admin-contacts'
import { CountBadge } from './CountBadge'

export function NewContactsBadge() {
  const { data } = useContactCounts()
  return <CountBadge count={data?.new} />
}
