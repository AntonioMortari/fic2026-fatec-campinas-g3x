import type { ReactNode } from 'react'

interface FieldMessagesProps {
  error?: string
  errorId?: string
  hint?: ReactNode
  hintId?: string
}

export function FieldMessages({ error, errorId, hint, hintId }: FieldMessagesProps) {
  return (
    <>
      {error && (
        <p id={errorId} className="m-0 text-small font-bold">
          {error}
        </p>
      )}
      {hint && !error && (
        <p id={hintId} className="m-0 text-small text-brown-400">
          {hint}
        </p>
      )}
    </>
  )
}
