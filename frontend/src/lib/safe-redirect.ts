const ALLOWED_PATH = /^\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?(?:\/[a-z0-9]+(?:[a-z0-9-]*[a-z0-9])?)*$/
const MAX_LENGTH = 120
const BLOCKED = ['/entrar', '/recuperar-acesso', '/nova-senha', '/auth']

export function safeRedirect(value: string | null | undefined, fallback = '/'): string {
  if (!value || value.length > MAX_LENGTH || !ALLOWED_PATH.test(value)) return fallback
  const blocked = BLOCKED.some((route) => value === route || value.startsWith(`${route}/`))
  return blocked ? fallback : value
}
