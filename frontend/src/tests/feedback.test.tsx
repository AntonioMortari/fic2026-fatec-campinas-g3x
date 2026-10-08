import { act, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Layout } from '../components/layout/Layout'
import { ActionBar, BackLink, Button, ToastProvider, useToast } from '../components/ui'
import { TOAST_DURATION_MS } from '../components/ui/toast-context'
import { renderRoute, renderWithRouter } from './render'

describe('Button loading state', () => {
  it('says "Enviando…", blocks a second click and exposes aria-busy', () => {
    render(<Button loading>Enviar</Button>)
    const button = screen.getByRole('button', { name: 'Enviando…' })

    expect(button).toBeDisabled()
    expect(button).toHaveAttribute('aria-busy', 'true')
  })
})

describe('toast', () => {
  function Trigger({ onUndo }: { onUndo: () => void }) {
    const show = useToast()
    return <button onClick={() => show('Ana P. marcada como veio', { action: { label: 'Desfazer', onClick: onUndo } })}>Marcar</button>
  }

  it('announces in a live region and runs its action', async () => {
    const user = userEvent.setup()
    const onUndo = vi.fn()
    render(
      <ToastProvider>
        <Trigger onUndo={onUndo} />
      </ToastProvider>,
    )

    await user.click(screen.getByRole('button', { name: 'Marcar' }))
    const status = screen.getByRole('status')
    expect(status).toHaveTextContent('Ana P. marcada como veio')

    await user.click(within(status).getByRole('button', { name: 'Desfazer' }))
    expect(onUndo).toHaveBeenCalledOnce()
    expect(status).toBeEmptyDOMElement()
  })

  it('goes away by itself', () => {
    vi.useFakeTimers()
    render(
      <ToastProvider>
        <Trigger onUndo={() => undefined} />
      </ToastProvider>,
    )

    act(() => screen.getByRole('button', { name: 'Marcar' }).click())
    expect(screen.getByRole('status')).not.toBeEmptyDOMElement()
    act(() => vi.advanceTimersByTime(TOAST_DURATION_MS))
    expect(screen.getByRole('status')).toBeEmptyDOMElement()
    vi.useRealTimers()
  })
})

describe('action bar', () => {
  it('replaces the bottom bar on routes that ask for it', () => {
    renderRoute('/detalhe', [
      {
        element: <Layout />,
        children: [
          {
            path: '/detalhe',
            handle: { hideBottomBar: true },
            element: <ActionBar primary={<Button>Levar para minha escola</Button>} secondary={<Button variant="secondary">WhatsApp</Button>} />,
          },
        ],
      },
    ])

    expect(screen.queryByRole('navigation', { name: 'Atalhos' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Levar para minha escola' })).toBeInTheDocument()
  })

  it('keeps the bottom bar everywhere else', () => {
    renderRoute('/')

    expect(screen.getByRole('navigation', { name: 'Atalhos' })).toBeInTheDocument()
  })
})

describe('BackLink', () => {
  it('names the destination for screen readers', () => {
    renderWithRouter(<BackLink to="/agenda" label="Agenda" />)

    expect(screen.getByRole('link', { name: 'Voltar para Agenda' })).toHaveAttribute('href', '/agenda')
  })
})
