import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CONTRAST_STORAGE_KEY, FONT_STORAGE_KEY, MAX_FONT_STEP, MIN_FONT_STEP, ReadingContext } from './reading-context'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string | null) {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, value)
  } catch {
    // Storage blocked (private tab): the preference lasts only for this visit.
  }
}

function initialFontStep(): number {
  const step = Number(read(FONT_STORAGE_KEY))
  return Number.isInteger(step) && step >= MIN_FONT_STEP && step <= MAX_FONT_STEP ? step : 0
}

export function ReadingPreferencesProvider({ children }: { children: ReactNode }) {
  const [fontStep, setFontStep] = useState(initialFontStep)
  const [highContrast, setHighContrast] = useState(() => read(CONTRAST_STORAGE_KEY) === 'high')

  useEffect(() => {
    const root = document.documentElement
    if (fontStep === 0) root.removeAttribute('data-font-scale')
    else root.setAttribute('data-font-scale', String(fontStep))
    write(FONT_STORAGE_KEY, fontStep === 0 ? null : String(fontStep))
  }, [fontStep])

  useEffect(() => {
    const root = document.documentElement
    if (highContrast) root.setAttribute('data-contrast', 'high')
    else root.removeAttribute('data-contrast')
    write(CONTRAST_STORAGE_KEY, highContrast ? 'high' : null)
  }, [highContrast])

  const decreaseFont = useCallback(() => setFontStep((step) => Math.max(MIN_FONT_STEP, step - 1)), [])
  const resetFont = useCallback(() => setFontStep(0), [])
  const increaseFont = useCallback(() => setFontStep((step) => Math.min(MAX_FONT_STEP, step + 1)), [])
  const toggleContrast = useCallback(() => setHighContrast((value) => !value), [])

  const value = useMemo(
    () => ({ fontStep, highContrast, decreaseFont, resetFont, increaseFont, toggleContrast }),
    [fontStep, highContrast, decreaseFont, resetFont, increaseFont, toggleContrast],
  )

  return <ReadingContext.Provider value={value}>{children}</ReadingContext.Provider>
}
