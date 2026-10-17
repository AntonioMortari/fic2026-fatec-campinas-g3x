import type { ReactNode } from 'react'
import { ErrorIcon } from './ErrorIcon'

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
        <div className="grid animate-unfold">
          <p id={errorId} className="m-0 flex items-start gap-1.5 overflow-hidden text-small font-bold text-error">
            <ErrorIcon className="mt-[0.2em] shrink-0" />
            <span>{error}</span>
          </p>
        </div>
      )}
      {hint && !error && (
        <p id={hintId} className="m-0 text-[0.84375rem] leading-[1.45] text-brown-400">
          {hint}
        </p>
      )}
    </>
  )
}
