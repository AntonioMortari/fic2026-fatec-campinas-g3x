import { render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { PastVenues } from '../components/schools/PastVenues'
import { CONTACTS } from '../lib/contacts'
import { DESKTOP_NAV, isMenuRoute } from '../lib/navigation'
import { PAST_VENUES } from '../lib/schools'
import { renderRoute } from './render'

describe('the schools page (RF38, designs 11h and 11i)', () => {
  it('opens with the overline, the single h1 and the lead', () => {
    renderRoute('/para-escolas')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1, name: 'Para escolas e instituições' })).toBeInTheDocument()
    expect(within(screen.getByRole('main')).getByText('Para escolas', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Levamos contações de história performáticas e vivências brincantes até o seu espaço, trabalhando cultura e memória afro-brasileira com as crianças.')).toBeInTheDocument()
  })

  it('has the five sections with their exact texts', () => {
    renderRoute('/para-escolas')

    const headings = within(screen.getByRole('main')).getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)
    expect(headings).toEqual(['Que atividades existem', 'O que a escola precisa providenciar', 'Onde já estivemos', 'Formato e duração', 'Solicitar uma atividade'])
    expect(screen.getByText('Nosso catálogo reúne contações de história performáticas, apresentações com fantoches e música ao vivo, e vivências de brincadeiras da cultura popular.')).toBeInTheDocument()
    expect(screen.getByText('A ficha técnica de cada atividade traz o que ela pede em detalhe.')).toBeInTheDocument()
    expect(screen.getByText('Conte para a gente qual atividade interessou, quantas crianças participariam e qual período você tem em mente. Respondemos pelo mesmo canal que você escolher.')).toBeInTheDocument()
  })

  it('lists the four rows of the spec sheet', () => {
    renderRoute('/para-escolas')

    const sheet = within(screen.getByRole('region', { name: 'Formato e duração' }))
    expect(sheet.getAllByRole('term').map((term) => term.textContent)).toEqual(['Público', 'Classificação', 'Duração', 'Local'])
    expect(sheet.getAllByRole('definition').map((detail) => detail.textContent)).toEqual([
      'Crianças, jovens e adultos, de todas as etnias e faixas etárias',
      'Livre',
      '50 minutos na maioria das atividades; algumas a combinar',
      'Adaptável a qualquer espaço',
    ])
  })

  it('lists the three things the school provides', () => {
    renderRoute('/para-escolas')

    const items = within(screen.getByRole('region', { name: 'O que a escola precisa providenciar' })).getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual([
      'Um espaço para a apresentação — adaptamos ao que a escola tiver',
      '1 caixa de som',
      '1 microfone, com ou sem fio, conforme a atividade',
    ])
  })

  it('lists the eleven places, with the detail only where there is one', () => {
    renderRoute('/para-escolas')

    const items = within(screen.getByRole('region', { name: 'Onde já estivemos' })).getAllByRole('listitem')
    expect(items).toHaveLength(11)
    expect(items[0]).toHaveTextContent(/^SESC Interlagos$/)
    expect(items[2]).toHaveTextContent('Fábricas de CulturaJaçanã')
    expect(items[7]).toHaveTextContent('AmbevAção de Dia das Crianças, Campinas · 2021')
    expect(items[10]).toHaveTextContent('(Re)Existência do Povo NegroSESC')
  })

  it('omits the whole "Onde já estivemos" section when the list is empty', () => {
    render(
      <MemoryRouter>
        <PastVenues venues={[]} />
      </MemoryRouter>,
    )

    expect(screen.queryByRole('heading', { name: 'Onde já estivemos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('list')).not.toBeInTheDocument()
  })

  it('renders the section when the list has entries', () => {
    render(
      <MemoryRouter>
        <PastVenues venues={PAST_VENUES.slice(0, 2)} />
      </MemoryRouter>,
    )

    expect(screen.getByRole('heading', { name: 'Onde já estivemos' })).toBeInTheDocument()
    expect(screen.getAllByRole('listitem')).toHaveLength(2)
  })

  it('points WhatsApp and e-mail to the real channels in the hero, the card and the fixed bar', () => {
    renderRoute('/para-escolas')

    const whatsapp = screen.getAllByRole('link', { name: 'Falar pelo WhatsApp' })
    const email = screen.getAllByRole('link', { name: 'Enviar e-mail' })
    expect(whatsapp).toHaveLength(3)
    expect(email).toHaveLength(3)
    for (const link of whatsapp) expect(link).toHaveAttribute('href', CONTACTS.whatsapp)
    for (const link of email) expect(link).toHaveAttribute('href', `mailto:${CONTACTS.email}`)
  })

  it('links the catalog to /projetos and the form to /contato', () => {
    renderRoute('/para-escolas')

    expect(screen.getByRole('link', { name: 'Ver o catálogo completo' })).toHaveAttribute('href', '/projetos')
    expect(screen.getByRole('link', { name: 'Prefere escrever por aqui? Use o formulário' })).toHaveAttribute('href', '/contato')
  })

  it('shows the identity photo with a descriptive alt text', () => {
    renderRoute('/para-escolas')

    const photo = screen.getByRole('img', { name: /Wil Oliveira, cofundador do ateliê/ })
    expect(photo).toHaveAttribute('src', '/images/sector-literary.jpg')
  })

  it('marks "Menu" in the bottom bar and no item of the desktop nav', () => {
    renderRoute('/para-escolas')

    const bar = screen.getByRole('navigation', { name: 'Atalhos' })
    expect(within(bar).getByRole('button', { name: 'Menu' }).className).toContain('font-bold')
    expect(isMenuRoute('/para-escolas', DESKTOP_NAV)).toBe(true)
  })
})
