export type CancelState = 'active' | 'cancelled' | 'over'

export interface CancelPreview {
  state: CancelState
  name: string
  event: { id: string; title: string; startsAt: string; endsAt: string | null; location: string | null }
}
