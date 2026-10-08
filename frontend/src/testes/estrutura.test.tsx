import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BARRA_INFERIOR, GRUPOS_DO_MENU } from '../compartilhado/navegacao'
import { abrirRota } from './renderizar'

describe('barra inferior (Análise UX/UI, 2a)', () => {
  it('tem os destinos da barra, Apoiar e Menu, nessa ordem', () => {
    abrirRota('/')
    const barra = screen.getByRole('navigation', { name: 'Atalhos' })
    const rotulos = within(barra)
      .getAllByRole('listitem')
      .map((item) => item.textContent)

    expect(rotulos).toEqual([...BARRA_INFERIOR.map((d) => d.rotulo), 'Apoiar', 'Menu'])
  })

  it('marca a rota atual com aria-current, e só ela', () => {
    abrirRota('/')
    const barra = screen.getByRole('navigation', { name: 'Atalhos' })

    expect(within(barra).getByRole('link', { name: 'Início' })).toHaveAttribute('aria-current', 'page')
    expect(within(barra).getByRole('link', { name: 'Agenda' })).not.toHaveAttribute('aria-current')
  })
})

describe('menu em folha (Análise UX/UI, 3a)', () => {
  it('abre pelo botão Menu, com os três grupos e o WhatsApp', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')
    const botao = screen.getByRole('button', { name: 'Menu' })
    expect(botao).toHaveAttribute('aria-expanded', 'false')

    await pessoa.click(botao)

    const menu = screen.getByRole('dialog', { name: 'Menu' })
    expect(menu).toHaveAttribute('open')
    expect(botao).toHaveAttribute('aria-expanded', 'true')
    for (const grupo of GRUPOS_DO_MENU) {
      expect(within(menu).getByRole('heading', { name: grupo.titulo })).toBeInTheDocument()
    }
    expect(within(menu).getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
  })

  it('fecha pelo ×', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')
    await pessoa.click(screen.getByRole('button', { name: 'Menu' }))

    await pessoa.click(screen.getByRole('button', { name: 'Fechar o menu' }))

    expect(screen.getByRole('dialog', { hidden: true })).not.toHaveAttribute('open')
  })

  it('"Aa" abre o menu já nos controles de leitura', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')

    await pessoa.click(screen.getByRole('button', { name: /^Aa, acessibilidade/ }))

    expect(screen.getByRole('heading', { name: 'Leitura' })).toHaveFocus()
  })
})

describe('preferências de leitura (acessibilidade pedida pela ONG)', () => {
  it('A+ aumenta o texto da raiz e a escolha fica guardada no aparelho', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')
    await pessoa.click(screen.getByRole('button', { name: 'Menu' }))

    await pessoa.click(screen.getByRole('button', { name: /^A\+/ }))
    await pessoa.click(screen.getByRole('button', { name: /^A\+/ }))

    expect(document.documentElement).toHaveAttribute('data-fonte', '2')
    expect(localStorage.getItem('af-fonte')).toBe('2')
  })

  it('A+ para no limite, e "A" volta ao normal tirando o atributo', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')
    await pessoa.click(screen.getByRole('button', { name: 'Menu' }))
    const aumentar = screen.getByRole('button', { name: /^A\+/ })

    for (let i = 0; i < 5; i++) if (!(aumentar as HTMLButtonElement).disabled) await pessoa.click(aumentar)
    expect(document.documentElement).toHaveAttribute('data-fonte', '3')
    expect(aumentar).toBeDisabled()

    await pessoa.click(screen.getByRole('button', { name: /^A, texto no tamanho normal/ }))
    expect(document.documentElement).not.toHaveAttribute('data-fonte')
    expect(localStorage.getItem('af-fonte')).toBeNull()
  })

  it('alto contraste troca os tokens e diz o estado com aria-pressed', async () => {
    const pessoa = userEvent.setup()
    abrirRota('/')
    await pessoa.click(screen.getByRole('button', { name: 'Menu' }))
    const contraste = screen.getByRole('button', { name: /Alto contraste/ })

    await pessoa.click(contraste)

    expect(document.documentElement).toHaveAttribute('data-contraste', 'alto')
    expect(contraste).toHaveAttribute('aria-pressed', 'true')
    expect(localStorage.getItem('af-contraste')).toBe('alto')
  })

  it('reaplica o que estava guardado', () => {
    localStorage.setItem('af-fonte', '1')
    localStorage.setItem('af-contraste', 'alto')

    abrirRota('/')

    expect(document.documentElement).toHaveAttribute('data-fonte', '1')
    expect(document.documentElement).toHaveAttribute('data-contraste', 'alto')
  })

  it('ignora valor guardado fora da faixa', () => {
    localStorage.setItem('af-fonte', '9')

    abrirRota('/')

    expect(document.documentElement).not.toHaveAttribute('data-fonte')
  })
})
