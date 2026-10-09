import { useNextEvent } from '../services/events'
import { Home } from './Home'

export function HomeContainer() {
  const { data } = useNextEvent()
  return <Home nextEvent={data ?? null} />
}
