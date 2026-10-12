import { useVolunteerCounts } from '../../services/admin-volunteers'
import { CountBadge } from './CountBadge'

export function NewVolunteersBadge() {
  const { data } = useVolunteerCounts()
  return <CountBadge count={data?.new} />
}
