import { useContext } from 'react'
import { ReadingContext, type ReadingPreferences } from './reading-context'

export function useReadingPreferences(): ReadingPreferences {
  const context = useContext(ReadingContext)
  if (!context) throw new Error('useReadingPreferences must be used inside <ReadingPreferencesProvider>')
  return context
}
