import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Button, Checkbox, ChipFilter, DateBadge, PasswordField, SelectField, Tabs, TextField } from '../components/ui'
import { dateParts } from '../lib/dates'
import { formatPhone } from '../lib/format-phone'
import { safeRedirect } from '../lib/safe-redirect'
import { renderWithRouter } from './render'

describe('Button', () => {
  it('is an internal link with `to`, an external one with `href`, and a type="button" otherwise', () => {
    renderWithRouter(
      <>
        <Button to="/agenda">Ver a agenda</Button>
        <Button href="https://wa.me/5511953968344">WhatsApp</Button>
        <Button>Enviar</Button>
      </>,
    )

    expect(screen.getByRole('link', { name: 'Ver a agenda' })).toHaveAttribute('href', '/agenda')
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'button')
  })
})

describe('TextField', () => {
  it('links the hint to the input', () => {
    render(<TextField label="Seu WhatsApp" hint="Opcional. Com DDD." />)

    expect(screen.getByLabelText('Seu WhatsApp')).toHaveAccessibleDescription('Opcional. Com DDD.')
  })

  it('shows the error instead of the hint, so the two never repeat each other', () => {
    render(<TextField label="Seu WhatsApp" hint="Opcional. Com DDD." error="Confira o número." />)
    const field = screen.getByLabelText('Seu WhatsApp')

    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription('Confira o número.')
    expect(screen.queryByText('Opcional. Com DDD.')).not.toBeInTheDocument()
  })

  it('does not set aria-invalid without an error', () => {
    render(<TextField label="E-mail" type="email" />)

    expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid')
  })
})

describe('SelectField', () => {
  it('starts on an explicit "choose" option and reports the chosen value', async () => {
    const user = userEvent.setup()
    render(<SelectField label="Esta conta é de" options={[{ value: 'a', label: 'Pessoa' }]} defaultValue="" />)
    const select = screen.getByLabelText('Esta conta é de')

    expect(select).toHaveValue('')
    await user.selectOptions(select, 'a')
    expect(select).toHaveValue('a')
  })
})

describe('Checkbox', () => {
  it('toggles from its label and links the error', async () => {
    const user = userEvent.setup()
    render(<Checkbox label="Concordo" error="Marque para continuar." />)
    const box = screen.getByLabelText('Concordo')

    expect(box).toHaveAttribute('aria-invalid', 'true')
    expect(box).toHaveAccessibleDescription('Marque para continuar.')
    await user.click(screen.getByText('Concordo'))
    expect(box).toBeChecked()
  })
})

describe('PasswordField', () => {
  it('"Mostrar" switches the input type and exposes its state', async () => {
    const user = userEvent.setup()
    render(<PasswordField label="Senha" />)
    const password = screen.getByLabelText('Senha')
    expect(password).toHaveAttribute('type', 'password')

    await user.click(screen.getByRole('button', { name: 'Mostrar senha' }))

    expect(password).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Tabs', () => {
  function Example() {
    const [active, setActive] = useState('a')
    return (
      <Tabs
        label="Período"
        activeId={active}
        onChange={setActive}
        tabs={[
          { id: 'a', label: 'Em breve', content: 'Painel A' },
          { id: 'b', label: 'Já aconteceu', content: 'Painel B' },
        ]}
      />
    )
  }

  it('follows the WAI-ARIA pattern: arrows switch tabs and only the active one is tabbable', async () => {
    const user = userEvent.setup()
    render(<Example />)
    const [first, second] = screen.getAllByRole('tab')
    expect(first).toHaveAttribute('aria-selected', 'true')
    expect(second).toHaveAttribute('tabindex', '-1')

    first!.focus()
    await user.keyboard('{ArrowRight}')

    expect(second).toHaveFocus()
    expect(second).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel B')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Já aconteceu')
  })
})

describe('ChipFilter', () => {
  it('exposes the choice with aria-pressed', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <ChipFilter
        label="Tipo"
        selected="all"
        onSelect={onSelect}
        options={[
          { value: 'all', label: 'Todas', count: 4 },
          { value: 'workshop', label: 'Oficina', count: 1 },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Todas 4' })).toHaveAttribute('aria-pressed', 'true')
    await user.click(screen.getByRole('button', { name: 'Oficina 1' }))
    expect(onSelect).toHaveBeenCalledWith('workshop')
  })
})

describe('dates in the organization time zone', () => {
  it('near midnight UTC, the São Paulo day wins, not the server day', () => {
    expect(dateParts(new Date('2026-10-18T01:30:00Z'))).toMatchObject({ weekday: 'SÁB', day: '17', month: 'OUT' })
  })

  it('the badge spells the date out for screen readers', () => {
    render(<DateBadge date={new Date('2026-10-17T17:00:00Z')} highlight />)

    expect(screen.getByText('sábado, 17 de outubro')).toHaveClass('sr-only')
  })
})

describe('safeRedirect', () => {
  it.each(['/voluntariado/candidatura', '/agenda'])('accepts the internal path %s', (path) => {
    expect(safeRedirect(path)).toBe(path)
  })

  it.each([
    '//unknown.example',
    'https://unknown.example',
    '/\\unknown.example',
    '/agenda?x=1',
    '/%2F%2Fsite',
    '/entrar',
    '/nova-senha',
    'agenda',
    '',
    null,
  ])('rejects %s and falls back to home', (value) => {
    expect(safeRedirect(value)).toBe('/')
  })
})

describe('formatPhone', () => {
  it('formats mobile and landline numbers and leaves anything else untouched', () => {
    expect(formatPhone('11953968344')).toBe('(11) 95396-8344')
    expect(formatPhone('1138968344')).toBe('(11) 3896-8344')
    expect(formatPhone('123')).toBe('123')
  })
})
