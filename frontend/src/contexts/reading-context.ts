import { createContext } from 'react'

export const MIN_FONT_STEP = -1
export const MAX_FONT_STEP = 3

export const FONT_STORAGE_KEY = 'af-font'
export const CONTRAST_STORAGE_KEY = 'af-contrast'

export interface ReadingPreferences {
  fontStep: number
  highContrast: boolean
  decreaseFont: () => void
  resetFont: () => void
  increaseFont: () => void
  toggleContrast: () => void
}

export const ReadingContext = createContext<ReadingPreferences | null>(null)
