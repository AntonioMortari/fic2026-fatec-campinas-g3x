import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it } from 'vitest'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'
import { AREAS } from './volunteering-support'

let mock: ReturnType<typeof mockApi>
afterEach(() => mock?.restore())

function open(areas: () => { status: number; data: unknown } | 'network-error' = () => ({ status: 200, data: { data: AREAS } })) {
  mock = mockApi({
    'POST /auth/refresh': () => ({ status: 401, data: {} }),
    'GET /volunteer-areas': areas,
  })
}

describe('the volunteering page (RF24, design 10c)', () => {
  it('opens with the section, the title and the lead, and no back link: it is a first-level page', async () => {
    open()
    renderRoute('/voluntariado')

    expect(await screen.findByRole('heading', { level: 1, name: 'Ser voluntário no Ateliê' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByText('Participar')).toBeInTheDocument()
    expect(screen.getByText(/Voluntariar aqui é somar com a gente na criação/)).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /Voltar/ })).not.toBeInTheDocument()
  })

  it('lists the five areas from the API as a numbered list, each with its real text', async () => {
    open()
    renderRoute('/voluntariado')

    const section = within(await screen.findByRole('region', { name: 'Onde você pode ajudar' }))
    const items = await section.findAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items.map((item) => item.querySelector('h3')?.textContent)).toEqual(AREAS.map((area) => area.name))
    expect(items.map((item) => item.firstElementChild?.textContent)).toEqual(['1', '2', '3', '4', '5'])
    expect(items[3]).toHaveTextContent('Catalogação de livros, roupas, instrumentos musicais, fantasias e peças de memória ancestral.')
    expect(section.getByText('Escolha uma ou mais áreas. Muita gente atua em duas.')).toBeInTheDocument()
  })

  it('explains how it works in three steps and says who may create an account', async () => {
    open()
    renderRoute('/voluntariado')

    const how = within(await screen.findByRole('region', { name: 'Como funciona' }))
    expect(how.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Você cria uma conta e escolhe suas áreas de interesse',
      'A gente lê sua candidatura e entra em contato para conversar',
      'Combinamos juntos o que faz sentido para você e para o ateliê',
    ])
    expect(how.getByText(/Para criar conta é preciso ter 18 anos ou mais/)).toBeInTheDocument()
  })

  it('offers "Quero me candidatar" to the application and "Tenho uma dúvida" to the contact page', async () => {
    open()
    renderRoute('/voluntariado')
    await screen.findByRole('heading', { name: 'Ser voluntário no Ateliê' })

    for (const apply of screen.getAllByRole('link', { name: 'Quero me candidatar' })) expect(apply).toHaveAttribute('href', '/voluntariado/candidatura')
    for (const doubt of screen.getAllByRole('link', { name: 'Tenho uma dúvida' })) expect(doubt).toHaveAttribute('href', '/contato')
  })

  it('says it is loading, and keeps the rest of the page', async () => {
    open(() => new Promise(() => undefined) as never)
    renderRoute('/voluntariado')

    expect(await screen.findByText('Carregando as áreas…')).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Como funciona' })).toBeInTheDocument()
  })

  it('says the areas could not load and tries again', async () => {
    const user = userEvent.setup()
    let attempts = 0
    open(() => (++attempts === 1 ? 'network-error' : { status: 200, data: { data: AREAS } }))
    renderRoute('/voluntariado')

    expect(await screen.findByText('Não conseguimos carregar as áreas agora')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar de novo' }))

    expect(await screen.findByText('Apoio pedagógico e oficinas')).toBeInTheDocument()
  })

  it('shows an API error as the same failure state', async () => {
    open(() => apiError(500, 'internal_error', 'Algo deu errado.'))
    renderRoute('/voluntariado')

    expect(await screen.findByText('Não conseguimos carregar as áreas agora')).toBeInTheDocument()
  })
})
