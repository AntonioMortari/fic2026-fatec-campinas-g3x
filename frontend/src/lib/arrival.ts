import { useEffect, useMemo } from 'react'

const STORAGE_KEY = 'af-arrived'

function read(): string[] {
  try {
    const parsed: unknown = JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter((item): item is string => typeof item === 'string') : []
  } catch {
    return []
  }
}

function remember(pathname: string) {
  try {
    const seen = read()
    if (!seen.includes(pathname)) sessionStorage.setItem(STORAGE_KEY, JSON.stringify([...seen, pathname]))
  } catch {
    // Storage blocked: every visit then counts as the first, which only costs a short animation.
  }
}

// True only the first time a page is opened in this session (round 22j). Reading is pure and the page is
// marked afterwards, so StrictMode's double render and a re-render of the layout give the same answer.
export function useArrival(pathname: string): boolean {
  const first = useMemo(() => !read().includes(pathname), [pathname])
  useEffect(() => remember(pathname), [pathname])
  return first
}
