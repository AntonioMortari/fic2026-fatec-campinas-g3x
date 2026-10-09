import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { getToken } from '../services/session'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

type User = ReturnType<typeof userEvent.setup>

async function openRegister(user: User) {
  renderRoute('/entrar')
  await user.click(screen.getByRole('tab', { name: 'Criar conta' }))
}

async function fillValid(user: User, { adult = true, consent = true } = {}) {
  await user.type(screen.getByLabelText(/^Nome completo/), 'Maria da Silva')
  await user.type(screen.getByLabelText(/^E-mail/), 'maria@example.com')
  await user.selectOptions(screen.getByLabelText(/^Esta conta é de/), 'individual')
  await user.type(screen.getByLabelText(/^Senha/), 'senha-segura-1')
  await user.click(screen.getByLabelText('Quero ser voluntário ou voluntária'))
  if (adult) await user.click(screen.getByLabelText('Confirmo que tenho 18 anos ou mais'))
  if (consent) await user.click(screen.getByLabelText('Concordo com o uso dos meus dados'))
}

const submit = (user: User) => user.click(screen.getByRole('button', { name: 'Criar conta' }))

describe('register form', () => {
  it('starts with nothing chosen and no pre-checked box', async () => {
    mock = mockApi({})
    await openRegister(userEvent.setup())

    expect(screen.getByLabelText(/^Esta conta é de/)).toHaveValue('')
    for (const box of screen.getAllByRole('checkbox')) expect(box).not.toBeChecked()
  })

  it('sends exactly the form fields, with an empty phone as null, and signs in', async () => {
    const user = userEvent.setup()
    mock = mockApi({ 'POST /auth/register': () => ({ status: 201, data: { token: 't.t.t', user: fakeUser } }) })
    await openRegister(user)
    await fillValid(user)
    await submit(user)

    await waitFor(() => expect(getToken()).toBe('t.t.t'))
    expect(mock.requests[0]?.body).toEqual({
      name: 'Maria da Silva',
      email: 'maria@example.com',
      phone: null,
      personType: 'individual',
      password: 'senha-segura-1',
      wantsToVolunteer: true,
      wantsToDonate: false,
      confirmsAdult: true,
      consent: true,
    })
  })

  it('never sends a role field', async () => {
    const user = userEvent.setup()
    mock = mockApi({ 'POST /auth/register': () => ({ status: 201, data: { token: 't.t.t', user: fakeUser } }) })
    await openRegister(user)
    await fillValid(user)
    await submit(user)

    await waitFor(() => expect(mock.requests).toHaveLength(1))
    expect(Object.keys((mock.requests[0]?.body ?? {}) as object).join(' ')).not.toMatch(/staff|role|admin/i)
  })

  it('sends confirmsAdult=false when the box is left unchecked and shows the server message on that field', async () => {
    const user = userEvent.setup()
    const message = 'Só quem tem 18 anos ou mais pode criar uma conta.'
    mock = mockApi({
      'POST /auth/register': () => apiError(400, 'validation_error', 'Confira os campos.', [{ field: 'confirmsAdult', message }]),
    })
    await openRegister(user)
    await fillValid(user, { adult: false })
    await submit(user)

    const checkbox = screen.getByLabelText('Confirmo que tenho 18 anos ou mais')
    await waitFor(() => expect(checkbox).toHaveAttribute('aria-invalid', 'true'))
    expect(mock.requests[0]?.body).toMatchObject({ confirmsAdult: false })
    expect(checkbox).toHaveAccessibleDescription(expect.stringContaining(message))
    expect(checkbox).toHaveFocus()
    expect(screen.getByRole('alert')).toHaveTextContent('Confira os campos destacados abaixo.')
    expect(getToken()).toBeNull()
  })

  it('keeps everything typed when the server refuses, password included', async () => {
    const user = userEvent.setup()
    mock = mockApi({
      'POST /auth/register': () =>
        apiError(409, 'email_taken', 'Já existe uma conta com esse e-mail. Entre com a sua senha.', [
          { field: 'email', message: 'Já existe uma conta com esse e-mail. Entre com a sua senha.' },
        ]),
    })
    await openRegister(user)
    await fillValid(user)
    await submit(user)

    await waitFor(() => expect(screen.getByLabelText(/^E-mail/)).toHaveAttribute('aria-invalid', 'true'))
    expect(screen.getByLabelText(/^Nome completo/)).toHaveValue('Maria da Silva')
    expect(screen.getByLabelText(/^Senha/)).toHaveValue('senha-segura-1')
    expect(screen.getByLabelText('Quero ser voluntário ou voluntária')).toBeChecked()
  })

  it('shows the participation error under its group', async () => {
    const user = userEvent.setup()
    const message = 'Escolha ao menos uma forma de participar: voluntariado, doação, ou as duas.'
    mock = mockApi({
      'POST /auth/register': () => apiError(400, 'validation_error', 'Confira os campos.', [{ field: 'participation', message }]),
    })
    await openRegister(user)
    await fillValid(user)
    await user.click(screen.getByLabelText('Quero ser voluntário ou voluntária'))
    await submit(user)

    expect(await screen.findByText(message)).toBeInTheDocument()
  })

  it('shows a network failure as a message, not as a field error', async () => {
    const user = userEvent.setup()
    mock = mockApi({ 'POST /auth/register': () => ({ status: 500, data: {} }) })
    await openRegister(user)
    await fillValid(user)
    await submit(user)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível concluir agora.')
    expect(screen.getByLabelText(/^Nome completo/)).toHaveValue('Maria da Silva')
  })
})
