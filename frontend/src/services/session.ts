// The access token lives in memory only: a token in localStorage is readable by any script that runs on the page.
// What survives a reload is the httpOnly refresh cookie, which scripts cannot read; this flag only tells the page
// whether it is worth asking for a session at start-up. It holds no secret.
const HINT_KEY = 'af-session'

let token: string | null = null
let onUnauthorized: (() => void) | null = null
let refresher: (() => Promise<RefreshOutcome>) | null = null
let inFlight: Promise<RefreshOutcome> | null = null

// 'ended': the server refused the cookie. 'unreachable': no answer, so the cookie may still be good.
export type RefreshOutcome = 'renewed' | 'ended' | 'unreachable'

export const getToken = () => token
export const setToken = (value: string | null) => {
  token = value
}

export function hasSessionHint(): boolean {
  try {
    return localStorage.getItem(HINT_KEY) === '1'
  } catch {
    return false
  }
}

export function setSessionHint(value: boolean) {
  try {
    if (value) localStorage.setItem(HINT_KEY, '1')
    else localStorage.removeItem(HINT_KEY)
  } catch {
    // storage blocked: the session still works, it just will not be restored on reload
  }
}

export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}
export const notifyUnauthorized = () => onUnauthorized?.()

export const setRefresher = (handler: (() => Promise<RefreshOutcome>) | null) => {
  refresher = handler
}

// One request at a time: the refresh cookie rotates on every use, so two parallel calls (StrictMode, or two
// requests failing together) would spend the same cookie twice.
export function refreshSession(): Promise<RefreshOutcome> {
  if (!refresher) return Promise.resolve('ended')
  inFlight ??= refresher().finally(() => {
    inFlight = null
  })
  return inFlight
}
