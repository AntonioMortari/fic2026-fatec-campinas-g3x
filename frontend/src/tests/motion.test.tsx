import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useFormFeedback } from '../components/auth/use-form-feedback'
import { Button, LoadingState, Skeleton } from '../components/ui'
import { ToastProvider } from '../components/ui/ToastProvider'
import { TOAST_DURATION_MS } from '../components/ui/toast-context'
import { useToast } from '../components/ui/useToast'
import { focusAndReveal, prefersReducedMotion, revealElement, scrollBehavior, scrollToStart, scrollToTop } from '../lib/motion'
import { mockApi } from './auth-support'
import { renderRoute } from './render'

function reduceMotion(reduce: boolean) {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: reduce && query.includes('reduce'), media: query, addEventListener: () => undefined, removeEventListener: () => undefined }))
}

afterEach(() => vi.unstubAllGlobals())

describe('motion helpers', () => {
  it('reads the reduced-motion preference, and treats a browser without matchMedia as "no preference"', () => {
    reduceMotion(true)
    expect(prefersReducedMotion()).toBe(true)
    reduceMotion(false)
    expect(prefersReducedMotion()).toBe(false)
    vi.stubGlobal('matchMedia', undefined)
    expect(prefersReducedMotion()).toBe(false)
  })

  it('scrolls smoothly only when motion is welcome', () => {
    reduceMotion(false)
    expect(scrollBehavior()).toBe('smooth')
    reduceMotion(true)
    expect(scrollBehavior()).toBe('auto')
  })

  it('reveals an element with the right behavior and block', () => {
    const element = document.createElement('div')
    const scrollIntoView = vi.spyOn(element, 'scrollIntoView')
    reduceMotion(false)
    revealElement(element)
    reduceMotion(true)
    revealElement(element, 'start')

    expect(scrollIntoView).toHaveBeenNthCalledWith(1, { block: 'nearest', behavior: 'smooth' })
    expect(scrollIntoView).toHaveBeenNthCalledWith(2, { block: 'start', behavior: 'auto' })
  })

  it('focuses without the browser jump, so the only movement is the one we control', () => {
    const input = document.createElement('input')
    document.body.append(input)
    const focus = vi.spyOn(input, 'focus')
    vi.spyOn(input, 'scrollIntoView')
    focusAndReveal(input)

    expect(focus).toHaveBeenCalledWith({ preventScroll: true })
    expect(input).toHaveFocus()
    input.remove()
  })

  it('goes to the top instantly after a route change, and smoothly inside a page', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo')
    reduceMotion(false)
    scrollToTop()
    scrollToStart()
    reduceMotion(true)
    scrollToStart()

    expect(scrollTo).toHaveBeenNthCalledWith(1, { top: 0, left: 0, behavior: 'instant' })
    expect(scrollTo).toHaveBeenNthCalledWith(2, { top: 0, left: 0, behavior: 'smooth' })
    expect(scrollTo).toHaveBeenNthCalledWith(3, { top: 0, left: 0, behavior: 'auto' })
  })
})

describe('scroll to the first error', () => {
  function Form({ fields }: { fields: Record<string, string> }) {
    const { formRef, alertRef, error, fail } = useFormFeedback()
    return (
      <form ref={formRef}>
        <button type="button" onClick={() => fail({ isAxiosError: true, response: { status: 400, data: { erro: { codigo: 'validacao', mensagem: 'Confira.', detalhes: fields } } } })}>
          Enviar
        </button>
        {error && <div ref={alertRef} role="alert" tabIndex={-1}>{error.message}</div>}
        <input aria-label="Nome" aria-invalid={fields.name ? true : undefined} />
        <input aria-label="E-mail" aria-invalid={fields.email ? true : undefined} />
      </form>
    )
  }

  beforeEach(() => {
    reduceMotion(false)
  })

  it('focuses the first invalid field and brings it to the middle of the screen', async () => {
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<Form fields={{ email: 'E-mail inválido', name: 'Obrigatório' }} />)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'center', behavior: 'smooth' })
  })

  it('falls back to the alert, at the start, and does not smooth-scroll for someone who asked for less motion', async () => {
    reduceMotion(true)
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    render(<Form fields={{}} />)
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveFocus())
    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'start', behavior: 'auto' })
  })
})

describe('skeleton', () => {
  it('announces the loading in words and hides the drawing from assistive technology', () => {
    render(<LoadingState label="Carregando a agenda…" shape="cards" count={3} />)

    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-busy', 'true')
    expect(status).toHaveTextContent('Carregando a agenda…')
    expect(screen.getByText('Carregando a agenda…')).toHaveClass('sr-only')
    expect(status.querySelectorAll(':scope > [aria-hidden="true"]')).toHaveLength(3)
  })

  it.each([
    ['cards', 2],
    ['rows', 4],
    ['lines', 5],
    ['block', 1],
  ] as const)('draws %s as many times as asked', (shape, count) => {
    render(<LoadingState label="Carregando…" shape={shape} count={count} />)

    expect(screen.getByRole('status').querySelectorAll(':scope > [aria-hidden="true"]')).toHaveLength(count)
  })

  it('appears after a delay and stops pulsing for reduced motion through the same animation tokens', () => {
    render(<LoadingState label="Carregando…" />)

    expect(screen.getByRole('status')).toHaveClass('animate-skeleton-in')
  })

  it('accepts a custom shape, so a page can reserve the height of what is coming', () => {
    render(
      <LoadingState label="Carregando seus dados…">
        <Skeleton className="h-76" />
      </LoadingState>,
    )

    expect(screen.getByRole('status').querySelectorAll('[aria-hidden="true"]')).toHaveLength(1)
  })
})

describe('button while sending', () => {
  it('says "Enviando…", keeps the width of the label and hides the label and the spinner from the reader', () => {
    render(
      <Button type="submit" loading>
        Confirmar inscrição
      </Button>,
    )

    const button = screen.getByRole('button', { name: 'Enviando…' })
    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
    expect(button.querySelectorAll('[aria-hidden="true"]')).toHaveLength(2)
    expect(button.querySelector('.invisible')).toHaveTextContent('Confirmar inscrição')
  })

  it('shows only the label when idle', () => {
    render(<Button>Confirmar inscrição</Button>)

    expect(screen.getByRole('button', { name: 'Confirmar inscrição' }).querySelector('.invisible')).toBeNull()
  })
})

describe('toast dismissal', () => {
  function Trigger() {
    const toast = useToast()
    return <button onClick={() => toast('Salvo')}>Mostrar</button>
  }

  it('leaves at once for someone who asked for less motion, without waiting for an exit animation', () => {
    vi.useFakeTimers()
    reduceMotion(true)
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: 'Mostrar' }).click())
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS))

    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    vi.useRealTimers()
  })

  it('plays the exit before it leaves for everyone else', () => {
    vi.useFakeTimers()
    reduceMotion(false)
    render(
      <ToastProvider>
        <Trigger />
      </ToastProvider>,
    )
    act(() => screen.getByRole('button', { name: 'Mostrar' }).click())
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS))

    expect(screen.getByText('Salvo').parentElement).toHaveClass('animate-sink')
    vi.useRealTimers()
  })
})

describe('scroll on navigation', () => {
  beforeEach(() => {
    reduceMotion(false)
  })

  it('goes to the top on a new page and brings back the old position on back', async () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined)
    const router = renderRoute('/')
    await act(() => router.navigate('/agenda'))
    expect(scrollTo).toHaveBeenLastCalledWith({ top: 0, left: 0, behavior: 'instant' })

    Object.defineProperty(window, 'scrollY', { configurable: true, value: 640 })
    window.dispatchEvent(new Event('scroll'))
    await act(() => router.navigate('/contato'))
    Object.defineProperty(window, 'scrollY', { configurable: true, value: 0 })
    scrollTo.mockClear()
    await act(() => router.navigate(-1))

    expect(scrollTo).toHaveBeenCalledWith({ top: 640, left: 0, behavior: 'instant' })
    expect(screen.getByRole('main')).toHaveFocus()
    Reflect.deleteProperty(window, 'scrollY')
  })
})

describe('registration form, minor of age', () => {
  it('brings the guardian fields into view smoothly when the box is checked', async () => {
    reduceMotion(false)
    const id = '3b3a6c52-6b0e-4d0b-9c58-1d2a5f1c9a10'
    const event = { id, title: 'Cafú e o Café', description: null, category: null, startsAt: '2030-10-17T17:00:00.000Z', endsAt: null, location: null, ageRange: null, capacity: null, spotsLeft: null, requiresCpf: false, registrationsOpen: true }
    const mock = mockApi({ [`GET /events/${id}`]: () => ({ status: 200, data: { event } }) })
    const scrollIntoView = vi.spyOn(Element.prototype, 'scrollIntoView')
    renderRoute(`/agenda/${id}/inscricao`)

    await userEvent.click(await screen.findByLabelText(/menos de 18 anos/))

    expect(scrollIntoView).toHaveBeenCalledWith({ block: 'nearest', behavior: 'smooth' })
    expect(screen.getByLabelText(/Nome do responsável/).closest('.animate-rise')).not.toBeNull()
    mock.restore()
  })
})
