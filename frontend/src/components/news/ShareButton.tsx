import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Button, useToast } from '../ui'

const COPIED_MS = 2500

export function ShareButton({ title }: { title: string }) {
  const toast = useToast()
  const { pathname } = useLocation()
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!copied) return
    const timer = window.setTimeout(() => setCopied(false), COPIED_MS)
    return () => window.clearTimeout(timer)
  }, [copied])

  async function share() {
    const url = `${window.location.origin}${pathname}`
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url })
      } catch {
        // Closing the share sheet is not an error.
      }
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
    } catch {
      toast('Não foi possível copiar o link agora.', { tone: 'error' })
    }
  }

  return (
    <>
      <Button variant="secondary" size="compact" className="min-h-12 text-[0.9375rem]" done={copied} doneLabel="Link copiado" onClick={() => void share()}>
        Compartilhar <span className="sr-only">{title}</span>
      </Button>
      <span role="status" className="sr-only">
        {copied ? 'Link copiado. É só colar onde quiser compartilhar.' : ''}
      </span>
    </>
  )
}
