import { useLocation } from 'react-router-dom'
import { Button, useToast } from '../ui'

export function ShareButton({ title }: { title: string }) {
  const toast = useToast()
  const { pathname } = useLocation()

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
      toast('Link copiado. É só colar onde quiser compartilhar.')
    } catch {
      toast('Não foi possível copiar o link agora.', { tone: 'error' })
    }
  }

  return (
    <Button variant="secondary" size="compact" className="min-h-12 text-[0.9375rem]" onClick={() => void share()}>
      Compartilhar <span className="sr-only">{title}</span>
    </Button>
  )
}
