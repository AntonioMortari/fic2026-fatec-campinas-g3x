import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { answerText, FAQ_ITEMS, FAQ_THEMES, filterFaq } from '../lib/faq'
import { DESKTOP_MENU_GROUPS, MENU_GROUPS } from '../lib/navigation'
import { renderRoute } from './render'

const questionButton = (name: RegExp) => screen.getByRole('button', { name })

describe('the content', () => {
  it('has nothing that points at a page that does not exist yet, and every answer sits in a theme', () => {
    const themes = new Set(FAQ_THEMES.map((theme) => theme.id))
    const existing = ['/agenda', '/contato', '/voluntariado']
    for (const item of FAQ_ITEMS) {
      expect(themes.has(item.theme)).toBe(true)
      for (const part of item.answer) if (typeof part !== 'string') expect(existing).toContain(part.to)
    }
    expect(new Set(FAQ_ITEMS.map((item) => item.id)).size).toBe(FAQ_ITEMS.length)
  })

  it('searches without caring for case or accent, and every word must match', () => {
    expect(filterFaq(FAQ_ITEMS, 'IMAGEM').map((item) => item.id)).toEqual(['imagem'])
    expect(filterFaq(FAQ_ITEMS, 'voluntario').map((item) => item.id)).toEqual(['voluntario'])
    expect(filterFaq(FAQ_ITEMS, 'escola providenciar').map((item) => item.id)).toEqual(['escola-providenciar'])
    expect(filterFaq(FAQ_ITEMS, 'escola xyzzy')).toEqual([])
    expect(filterFaq(FAQ_ITEMS, ' a ')).toHaveLength(FAQ_ITEMS.length)
  })

  it('has the real address and phone in the answers, written from the contact data', () => {
    const where = FAQ_ITEMS.find((item) => item.id === 'onde-fica')!
    expect(answerText(where)).toContain('Rua Dr. Paulo Gatti, 135')
    expect(answerText(where)).toContain('02468-030')
  })
})

describe('the page (design 18)', () => {
  it('opens with the single h1, the search and every theme with its questions closed', () => {
    renderRoute('/perguntas-frequentes')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Perguntas frequentes' })).toBeInTheDocument()
    expect(screen.getByRole('search', { name: 'Buscar nas perguntas' })).toBeInTheDocument()
    const main = within(screen.getByRole('main'))
    expect(main.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([...FAQ_THEMES.map((theme) => theme.name), 'Ficou alguma dúvida?'])
    for (const button of main.getAllByRole('button', { expanded: false })) expect(button).toHaveAttribute('aria-controls')
    expect(main.queryAllByRole('button', { expanded: true })).toHaveLength(0)
  })

  it('opens and closes an answer on click', async () => {
    const user = userEvent.setup()
    renderRoute('/perguntas-frequentes')
    const button = questionButton(/Preciso autorizar o uso da minha imagem/)

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText(/nenhuma foto vai para o site sem autorização registrada/)).toBeVisible()

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('arrives with the question of the address already open, and it can still be closed', async () => {
    const user = userEvent.setup()
    renderRoute('/perguntas-frequentes#imagem')
    const button = questionButton(/Preciso autorizar o uso da minha imagem/)

    expect(button).toHaveAttribute('aria-expanded', 'true')
    expect(questionButton(/Quem tem menos de 18 anos/)).toHaveAttribute('aria-expanded', 'false')

    await user.click(button)
    expect(button).toHaveAttribute('aria-expanded', 'false')
  })

  it('filters while typing, opens what it finds, says how many and goes back with "ver todas"', async () => {
    const user = userEvent.setup()
    renderRoute('/perguntas-frequentes')

    await user.type(screen.getByRole('searchbox'), 'escola')

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('2 perguntas encontradas')
    const main = within(screen.getByRole('main'))
    expect(main.getAllByRole('button', { expanded: true })).toHaveLength(2)
    expect(main.queryByRole('button', { name: /Onde fica o Ateliê/ })).not.toBeInTheDocument()

    await user.click(within(within(screen.getByRole('main')).getByRole('status')).getByRole('button', { name: 'ver todas' }))
    expect(within(screen.getByRole('main')).queryByRole('status')).not.toBeInTheDocument()
    expect(main.getAllByRole('button', { name: /\?/ }).length).toBe(FAQ_ITEMS.length)
  })

  it('with no result, offers WhatsApp and the form instead of an empty page', async () => {
    const user = userEvent.setup()
    renderRoute('/perguntas-frequentes')

    await user.type(screen.getByRole('searchbox'), 'xyzzy')

    expect(screen.getByText('Nenhuma pergunta com essas palavras.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Falar no WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.getByRole('link', { name: 'Escrever uma mensagem' })).toHaveAttribute('href', '/contato')
  })

  it('does not submit the search as a page load', async () => {
    const user = userEvent.setup()
    renderRoute('/perguntas-frequentes')

    await user.type(screen.getByRole('searchbox'), 'imagem{Enter}')

    expect(within(screen.getByRole('main')).getByRole('status')).toHaveTextContent('1 pergunta encontrada')
  })
})

describe('where the question shows up (design 18c)', () => {
  it('is in the footer and in the help group of both menus', () => {
    expect(MENU_GROUPS.find((group) => group.title === 'Ajuda')?.items.map((item) => item.to)).toContain('/perguntas-frequentes')
    expect(DESKTOP_MENU_GROUPS.find((group) => group.title === 'Ajuda')?.items.map((item) => item.to)).toContain('/perguntas-frequentes')
    renderRoute('/')
    expect(within(screen.getByRole('contentinfo')).getByRole('link', { name: 'Perguntas frequentes' })).toHaveAttribute('href', '/perguntas-frequentes')
  })

  it('links the schools page to the two school questions, straight to their addresses', () => {
    renderRoute('/para-escolas')
    const main = within(screen.getByRole('main'))

    expect(main.getByRole('link', { name: 'O que a escola precisa providenciar?' })).toHaveAttribute('href', '/perguntas-frequentes#escola-providenciar')
    expect(main.getByRole('link', { name: 'Quanto dura e qual é a classificação?' })).toHaveAttribute('href', '/perguntas-frequentes#escola-duracao')
  })

  it('links the contact page, above the form, to the whole list', () => {
    renderRoute('/contato')

    expect(screen.getByRole('link', { name: 'Talvez já esteja respondido: perguntas frequentes' })).toHaveAttribute('href', '/perguntas-frequentes')
  })
})
