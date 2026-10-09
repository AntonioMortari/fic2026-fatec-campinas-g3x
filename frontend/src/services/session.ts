// Memory only, on purpose: a token in localStorage is readable by any script that runs on the page. Do not persist it.
let token: string | null = null
let onUnauthorized: (() => void) | null = null

export const getToken = () => token
export const setToken = (value: string | null) => {
  token = value
}
export const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler
}
export const notifyUnauthorized = () => onUnauthorized?.()
