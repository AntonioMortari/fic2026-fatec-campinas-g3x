import { screen, within } from '@testing-library/react'
import { Home } from '../pages/Home'
import { renderRoute, renderWithRouter } from './render'

const EVENT = {
  id: 'cafu-e-o-cafe',
  title: 'Cafú e o Café',
  description: null,
  category: 'Contação de história',
  startsAt: '2026-10-17T17:00:00Z',
  endsAt: null,
  location: 'Sede, Vila Romero',
  ageRange: 'Livre',
  capacity: null,
  spotsLeft: null,
}

describe('home page (UX/UI analysis 2a and 6a)', () => {
  it('opens with the hero heading and a single main action', () => {
    renderRoute('/')
    const hero = screen.getByRole('region', { name: /Arte, memória e pertencimento/ })

    expect(within(hero).getByRole('link', { name: 'Conhecer nossos projetos' })).toHaveAttribute('href', '/projetos')
    expect(within(hero).getByRole('img')).toHaveAccessibleName(/Wil Oliveira/)
  })

  it('offers the four starting points in order, each one a link', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Por onde começar' })

    const links = within(section).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/quem-somos', '/agenda', '/voluntariado', '/doar'])
  })

  it('shows the three sectors with described photos', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'O que fazemos' })

    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
      'Literário',
      'Musical',
      'Artístico criativo',
    ])
    for (const image of within(section).getAllByRole('img')) expect(image).toHaveAccessibleName(/\S/)
  })

  it('points schools to the schools page', () => {
    renderRoute('/')

    expect(
      within(screen.getByRole('region', { name: 'É de uma escola ou instituição?' })).getByRole('link', { name: 'Ver como funciona' }),
    ).toHaveAttribute('href', '/para-escolas')
  })

  it('does not invent a next activity when there is no published event', () => {
    renderRoute('/')

    expect(screen.queryByRole('region', { name: 'Próxima atividade' })).not.toBeInTheDocument()
  })

  it('shows the next activity, with its registration link, when there is one', () => {
    renderWithRouter(<Home nextEvent={EVENT} />)
    const section = screen.getByRole('region', { name: 'Próxima atividade' })

    expect(within(section).getByRole('heading', { name: 'Cafú e o Café' })).toBeInTheDocument()
    expect(within(section).getByText('sábado, 17 de outubro')).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Quero me inscrever' })).toHaveAttribute('href', '/agenda/cafu-e-o-cafe/inscricao')
  })

  it('says the spots are over, with no link, when none is left', () => {
    renderWithRouter(<Home nextEvent={{ ...EVENT, capacity: 5, spotsLeft: 0 }} />)
    const section = screen.getByRole('region', { name: 'Próxima atividade' })

    expect(within(section).queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument()
    expect(within(section).getAllByText('Vagas esgotadas').length).toBeGreaterThan(0)
  })

  it('keeps at most one applique on the screen', () => {
    renderWithRouter(<Home nextEvent={EVENT} />)

    expect(document.querySelectorAll('[class*="shadow-applique"]')).toHaveLength(1)
  })
})
