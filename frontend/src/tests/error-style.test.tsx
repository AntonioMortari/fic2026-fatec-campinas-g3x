import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { Alert, Checkbox, EmptyState, SelectField, TextAreaField, TextField, ToastProvider, useToast } from '../components/ui'

describe('how every form shows an error (the standard for the next forms)', () => {
  it.each([
    ['TextField', <TextField key="t" label="E-mail" error="Confira o e-mail." />, 'E-mail'],
    ['SelectField', <SelectField key="s" label="Tipo" options={[]} error="Escolha um tipo." />, 'Tipo'],
    ['TextAreaField', <TextAreaField key="a" label="Descrição" error="Passou do limite." />, 'Descrição'],
  ])('%s: thick red border, with no brown left to win on focus, red message with an icon, never the ink color', (_name, element, label) => {
    render(element)
    const box = screen.getByLabelText(label).parentElement as HTMLElement
    const message = screen.getByText(/\./).closest('p') as HTMLElement

    expect(box.className).toContain('border-error')
    expect(box.className).not.toContain('border-brown')
    expect(box.className).not.toContain('border-line-strong')
    expect(message.className).toContain('text-error')
    expect(message.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  it('Checkbox: the message is red with an icon too', () => {
    render(<Checkbox label="Concordo" error="Marque para continuar." />)

    const message = screen.getByText('Marque para continuar.').closest('p') as HTMLElement
    expect(message.className).toContain('text-error')
    expect(message.querySelector('svg[aria-hidden="true"]')).not.toBeNull()
  })

  it('a field without an error has no red, and its hint keeps the secondary ink', () => {
    render(<TextField label="E-mail" hint="É por aqui que respondemos você." />)

    expect((screen.getByLabelText('E-mail').parentElement as HTMLElement).className).not.toContain('error')
    expect(screen.getByText('É por aqui que respondemos você.').className).toContain('text-brown-400')
  })

  it('the icon never reaches the accessible description: the message is read as plain text', () => {
    render(<TextField label="E-mail" error="Confira o e-mail." />)

    expect(screen.getByLabelText('E-mail')).toHaveAccessibleDescription('Confira o e-mail.')
  })

  it('Alert error: red border, red tint, icon, announced as an alert; info stays neutral', () => {
    const { rerender } = render(<Alert tone="error">Confira os campos.</Alert>)
    const alert = screen.getByRole('alert')

    expect(alert.className).toContain('border-error')
    expect(alert.className).toContain('bg-error-tint')
    expect(alert.querySelector('svg[aria-hidden="true"]')).not.toBeNull()

    rerender(<Alert tone="info">Sua sessão terminou.</Alert>)
    const info = screen.getByRole('status')
    expect(info.className).not.toContain('error')
    expect(info.querySelector('svg')).toBeNull()
  })

  it('EmptyState error: announced as an alert, red; the neutral one stays a status', () => {
    const { rerender } = render(<EmptyState tone="error" title="Não conseguimos carregar" />)
    expect(screen.getByRole('alert').className).toContain('border-error')

    rerender(<EmptyState title="Nenhum evento ainda" />)
    expect(screen.getByRole('status').className).not.toContain('error')
  })

  it('the error toast is red, the ordinary one is not', async () => {
    const user = userEvent.setup()
    function Buttons() {
      const toast = useToast()
      return (
        <>
          <button onClick={() => toast('Tudo certo.')}>ok</button>
          <button onClick={() => toast('Não deu.', { tone: 'error' })}>falha</button>
        </>
      )
    }
    render(
      <ToastProvider>
        <Buttons />
      </ToastProvider>,
    )

    await act(() => user.click(screen.getByText('ok')))
    expect((screen.getByText('Tudo certo.').parentElement as HTMLElement).className).toContain('bg-brown')
    await act(() => user.click(screen.getByText('falha')))
    expect((screen.getByText('Não deu.').parentElement as HTMLElement).className).toContain('bg-error')
  })
})
