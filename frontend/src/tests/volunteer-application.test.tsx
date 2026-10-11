import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { apiError, fakeUser, mockApi } from './auth-support'
import { renderRoute } from './render'
import { AREAS, mine } from './volunteering-support'

type Handlers = Parameters<typeof mockApi>[0]

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

const ACCOUNT = { ...fakeUser, name: 'Larissa Mendes', email: 'larissa@exemplo.com', phone: '11981234567' }
const PATH = '/voluntariado/candidatura'

function openSignedIn(applications: unknown[] = [], handlers: Handlers = {}) {
  localStorage.setItem('af-session', '1')
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 200, data: { token: 'a.b.c', user: ACCOUNT } }),
    'GET /me/volunteer-applications': () => ({ status: 200, data: { data: applications } }),
    'GET /volunteer-areas': () => ({ status: 200, data: { data: AREAS } }),
    ...handlers,
  })
}

function openAnonymous() {
  mock = mockApi({ 'POST /auth/refresh': () => ({ status: 401, data: {} }) })
}

const calls = (key: string) => mock.requests.filter((request) => `${request.method} ${request.url}` === key)
const submit = () => userEvent.click(screen.getByRole('button', { name: 'Enviar minha candidatura' }))

describe('the application without an account (design 10d)', () => {
  it('is public: it explains why an account is needed instead of sending the person away', async () => {
    openAnonymous()
    const router = renderRoute(PATH)

    expect(await screen.findByRole('heading', { level: 1, name: 'Candidatar-se ao voluntariado' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Para se candidatar é preciso ter uma conta' })).toBeInTheDocument()
    expect(screen.getByText(/É pela conta que a sua candidatura fica ligada a você/)).toBeInTheDocument()
    expect(screen.getByText(/Para criar conta é preciso ter 18 anos ou mais/)).toBeInTheDocument()
    expect(router.state.location.pathname).toBe(PATH)
  })

  it('sends "Criar conta ou entrar" to the sign-in and back here afterwards, and "Ver as áreas" to the areas', async () => {
    openAnonymous()
    renderRoute(PATH)

    expect(await screen.findByRole('link', { name: 'Criar conta ou entrar' })).toHaveAttribute('href', '/entrar?voltar=%2Fvoluntariado%2Fcandidatura')
    expect(screen.getByRole('link', { name: 'Ver as áreas' })).toHaveAttribute('href', '/voluntariado')
  })

  it('offers the real WhatsApp and e-mail as the way without an account', async () => {
    openAnonymous()
    renderRoute(PATH)

    const main = within(await screen.findByRole('main'))
    expect(main.getByRole('link', { name: '(11) 95396-8344' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(main.getByRole('link', { name: 'atelieafro@gmail.com' })).toHaveAttribute('href', 'mailto:atelieafro@gmail.com')
  })

  it('lists what happens next and asks for nothing from the API about the person', async () => {
    openAnonymous()
    renderRoute(PATH)

    const next = within(await screen.findByRole('region', { name: 'O que acontece depois' }))
    expect(next.getAllByRole('listitem')).toHaveLength(3)
    expect(mock.requests.map((request) => request.url)).not.toContain('/me/volunteer-applications')
  })

  it('goes back to the volunteering page', async () => {
    openAnonymous()
    renderRoute(PATH)

    const back = (await screen.findAllByRole('link', { name: /Voluntariado/ })).filter((link) => link.getAttribute('href') === '/voluntariado')
    expect(back.length).toBeGreaterThan(0)
  })
})

describe('the application form (designs 10e and 10i)', () => {
  it('greets by the first name and lists the five areas as checkboxes with their text inside', async () => {
    openSignedIn()
    renderRoute(PATH)

    expect(await screen.findByText('Olá, Larissa')).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Sua candidatura')
    const boxes = screen.getAllByRole('checkbox')
    expect(boxes).toHaveLength(5)
    expect(boxes.map((box) => box.closest('label')?.textContent)).toEqual(AREAS.map((area) => `${area.name}${area.description}`))
    expect(screen.getByText('Pode marcar mais de uma · 0 marcadas')).toBeInTheDocument()
  })

  it('counts the marked areas as they are marked and unmarked', async () => {
    const user = userEvent.setup()
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('checkbox', { name: /Apoio pedagógico e oficinas/ }))
    expect(screen.getByText('Pode marcar mais de uma · 1 marcada')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Comunicação e mídias/ }))
    expect(screen.getByText('Pode marcar mais de uma · 2 marcadas')).toBeInTheDocument()
    await user.click(screen.getByRole('checkbox', { name: /Apoio pedagógico e oficinas/ }))
    expect(screen.getByText('Pode marcar mais de uma · 1 marcada')).toBeInTheDocument()
  })

  it('has a visible character counter and an optional message, with the real limit', async () => {
    const user = userEvent.setup()
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    expect(screen.getByText('0 / 2000')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ }), 'Sábado de manhã.')
    expect(screen.getByText('16 / 2000')).toBeInTheDocument()
    expect(screen.getByText(/Dias e horários que dão para você/)).toBeInTheDocument()
  })

  it('warns, in text and in the counter, when the message passes the limit', async () => {
    const user = userEvent.setup()
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ }))
    await user.paste('a'.repeat(2001))

    expect(screen.getByText('2001 / 2000')).toHaveClass('text-error')
    expect(screen.getByText('O texto passou de 2000 caracteres.')).toBeInTheDocument()
  })

  it('sends only the areas and the message, never a person or a status', async () => {
    const user = userEvent.setup()
    openSignedIn([], { 'POST /volunteer-applications': () => ({ status: 201, data: { application: mine() } }) })
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('checkbox', { name: /Apoio pedagógico e oficinas/ }))
    await user.click(screen.getByRole('checkbox', { name: /Comunicação e mídias/ }))
    await user.type(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ }), 'Sábado de manhã.')
    await submit()

    await waitFor(() => expect(calls('POST /volunteer-applications')).toHaveLength(1))
    expect(calls('POST /volunteer-applications')[0]!.body).toEqual({ areas: ['apoio-pedagogico', 'comunicacao'], message: 'Sábado de manhã.' })
    expect(calls('POST /volunteer-applications')[0]!.authorization).toBe('Bearer a.b.c')
  })

  it('goes to the "you already applied" screen right after sending, without a second form', async () => {
    const user = userEvent.setup()
    let saved: unknown[] = []
    openSignedIn([], {
      'GET /me/volunteer-applications': () => ({ status: 200, data: { data: saved } }),
      'POST /volunteer-applications': () => {
        saved = [mine()]
        return { status: 201, data: { application: mine() } }
      },
    })
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('checkbox', { name: /Apoio pedagógico e oficinas/ }))
    await submit()

    expect(await screen.findByRole('heading', { name: 'Você já se candidatou' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Você já se candidatou' })).toHaveFocus()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Enviar minha candidatura' })).not.toBeInTheDocument()
  })

  it('puts the error of the group at the top and keeps what was typed, when no area is marked', async () => {
    const user = userEvent.setup()
    openSignedIn([], {
      'POST /volunteer-applications': () => apiError(400, 'invalid_data', 'Confira os dados enviados.', [{ field: 'areas', message: 'Escolha ao menos uma área.' }]),
    })
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.type(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ }), 'Sábado de manhã.')
    await submit()

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Escolha ao menos uma área.')
    expect(alert).toHaveFocus()
    expect(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ })).toHaveValue('Sábado de manhã.')
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
  })

  it('marks the message field when the server refuses the text', async () => {
    const user = userEvent.setup()
    openSignedIn([], {
      'POST /volunteer-applications': () => apiError(400, 'invalid_data', 'Confira os dados enviados.', [{ field: 'message', message: 'O texto passou de 2000 caracteres.' }]),
    })
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('checkbox', { name: /Comunicação e mídias/ }))
    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Confira o texto marcado abaixo.')
    expect(screen.getByRole('textbox', { name: /Quer contar alguma coisa/ })).toHaveAttribute('aria-invalid', 'true')
  })

  it('shows the server sentence when another tab already registered the application', async () => {
    const user = userEvent.setup()
    openSignedIn([], { 'POST /volunteer-applications': () => apiError(409, 'already_applied', 'Você já tem uma candidatura em andamento.') })
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    await user.click(screen.getByRole('checkbox', { name: /Comunicação e mídias/ }))
    await submit()

    expect(await screen.findByRole('alert')).toHaveTextContent('Você já tem uma candidatura em andamento.')
  })

  it('shows who the application is sent as, with the contact data the staff will use, and the way to fix them', async () => {
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    const aside = within(screen.getByLabelText('Sobre o envio', { selector: 'aside' }))
    expect(aside.getByText('Enviando como')).toBeInTheDocument()
    expect(aside.getByText('Larissa Mendes')).toBeInTheDocument()
    expect(aside.getByText(/larissa@exemplo.com · \(11\) 98123-4567/)).toBeInTheDocument()
    expect(aside.getByRole('link', { name: 'Alterar meus dados' })).toHaveAttribute('href', '/minha-conta/dados')
    expect(aside.getByRole('link', { name: 'Fale com a gente' })).toHaveAttribute('href', '/contato')
    expect(aside.getAllByRole('listitem')).toHaveLength(3)
  })

  it('does not ask again for the age: the account already confirmed it', async () => {
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    expect(screen.queryByText(/18 anos|maior de idade|maioridade/i)).not.toBeInTheDocument()
  })

  it('lets someone whose application ended apply again', async () => {
    openSignedIn([mine({ status: 'ended' })])
    renderRoute(PATH)

    expect(await screen.findByText('Olá, Larissa')).toBeInTheDocument()
    expect(screen.getAllByRole('checkbox')).toHaveLength(5)
  })

  it('says the list of applications could not load, and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    openSignedIn([], {
      'GET /me/volunteer-applications': () => (++attempts === 1 ? 'network-error' : { status: 200, data: { data: [] } }),
    })
    renderRoute(PATH)

    expect(await screen.findByText('Não conseguimos carregar sua candidatura')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Olá, Larissa')).toBeInTheDocument()
  })

  it('says the areas could not load, and the form does not appear half drawn', async () => {
    openSignedIn([], { 'GET /volunteer-areas': () => 'network-error' })
    renderRoute(PATH)

    expect(await screen.findByText('Não conseguimos carregar as áreas')).toBeInTheDocument()
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})

describe('"you already applied" (design 10f)', () => {
  it('shows the situation in the words of the person, the date and the chosen areas, and no form', async () => {
    openSignedIn([mine()])
    renderRoute(PATH)

    expect(await screen.findByRole('heading', { level: 1, name: 'Você já se candidatou' })).toBeInTheDocument()
    expect(screen.getByText('Enviada')).toBeInTheDocument()
    expect(screen.getByText(/Recebida, ainda sem resposta — enviada em 9 de outubro de 2026\./)).toBeInTheDocument()
    const chosen = within(screen.getByRole('list', { name: 'Áreas escolhidas' }))
    expect(chosen.getAllByRole('listitem').map((item) => item.textContent)).toEqual(['Apoio pedagógico e oficinas', 'Comunicação e mídias'])
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })

  it('draws the three steps as a timeline with only the first one done while nobody answered', async () => {
    openSignedIn([mine()])
    renderRoute(PATH)

    const steps = within(await screen.findByRole('list', { name: 'Etapas depois da candidatura' })).getAllByRole('listitem')
    expect(steps).toHaveLength(3)
    expect(steps[0]).toHaveTextContent('(já aconteceu)')
    expect(steps[1]).not.toHaveTextContent('(já aconteceu)')
    expect(steps[2]).not.toHaveTextContent('(já aconteceu)')
  })

  it.each([
    ['in_contact', 'A ONG está falando com você', 2],
    ['volunteering', 'Voluntariado ativo', 3],
  ] as const)('uses the vocabulary of the person for %s and advances the timeline to %i', async (status, words, done) => {
    openSignedIn([mine({ status })])
    renderRoute(PATH)

    expect(await screen.findByText(new RegExp(`${words} — enviada em`))).toBeInTheDocument()
    const steps = within(screen.getByRole('list', { name: 'Etapas depois da candidatura' })).getAllByRole('listitem')
    expect(steps.filter((step) => step.textContent?.includes('(já aconteceu)'))).toHaveLength(done)
    expect(screen.queryByText('Nova')).not.toBeInTheDocument()
  })

  it('says only the staff can change the areas, with the WhatsApp, and links to the account', async () => {
    openSignedIn([mine()])
    renderRoute(PATH)

    await screen.findByRole('heading', { name: 'Você já se candidatou' })
    expect(screen.getByText(/Não precisa mandar de novo/)).toBeInTheDocument()
    expect(screen.getByText(/a candidatura só a equipe do Ateliê consegue alterar/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: '(11) 95396-8344' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.getByRole('link', { name: 'Ver na minha conta' })).toHaveAttribute('href', '/minha-conta/candidaturas')
  })

  it('keeps the public header and bottom bar, which the form hides on the phone', async () => {
    openSignedIn([mine()])
    renderRoute(PATH)
    await screen.findByRole('heading', { name: 'Você já se candidatou' })

    expect(screen.getByRole('navigation', { name: 'Atalhos' })).toBeInTheDocument()
    expect(screen.getAllByRole('banner')[0]).not.toHaveClass('max-desktop:hidden')
  })

  it('hides them for the form, which has its own back bar', async () => {
    openSignedIn()
    renderRoute(PATH)
    await screen.findByText('Olá, Larissa')

    expect(screen.queryByRole('navigation', { name: 'Atalhos' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('banner')[0]).toHaveClass('max-desktop:hidden')
  })
})
