import { afterEach, beforeEach, vi } from 'vitest'

// The fixtures carry real dates; without a fixed "now" they become the past as the calendar moves and the tests rot.
// Only Date is faked, so timers, promises and user-event keep working.
export function freezeNow(iso = '2026-10-10T12:00:00-03:00') {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(iso))
  })

  afterEach(() => {
    vi.useRealTimers()
  })
}
