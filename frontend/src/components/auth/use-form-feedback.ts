import { useEffect, useRef, useState } from 'react'
import { parseApiError, type ParsedApiError } from '../../lib/api-error'

export function useFormFeedback() {
  const form = useRef<HTMLFormElement>(null)
  const alert = useRef<HTMLDivElement>(null)
  const [error, setError] = useState<ParsedApiError | null>(null)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    if (!error) return
    const firstInvalid = form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
    ;(firstInvalid ?? alert.current)?.focus()
  }, [error, attempt])

  return {
    formRef: form,
    alertRef: alert,
    error,
    fields: error?.fields ?? {},
    clear: () => setError(null),
    fail: (cause: unknown) => {
      setError(parseApiError(cause))
      setAttempt((value) => value + 1)
    },
  }
}
