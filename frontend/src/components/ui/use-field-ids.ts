import { useId } from 'react'

export function useFieldIds(id: string | undefined, hasHint: boolean, hasError: boolean) {
  const generatedId = useId()
  const fieldId = id ?? generatedId
  const hintId = hasHint && !hasError ? `${fieldId}-hint` : undefined
  const errorId = hasError ? `${fieldId}-error` : undefined
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined
  return { fieldId, hintId, errorId, describedBy }
}
