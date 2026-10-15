import { act, screen, within } from '@testing-library/react'
import { renderRoute } from './render'

describe('About page', () => {
  it('opens on the mission sentence of screen 5b', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Um espaço educativo de reflexão, criação e valorização da cultura e memória afro-brasileira',
    )
    expect(screen.getByText('Quem somos', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Casa Verde, zona norte de São Paulo · desde 2020')).toBeInTheDocument()
  })

  it('lists the four sections as anchors, Sankofa marked as the current one', () => {
    renderRoute('/quem-somos')

    const index = screen.getByRole('navigation', { name: 'Nesta página' })
    const links = within(index).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#sankofa', '#quem-idealizou', '#missao', '#setores', '#onde-estamos'])
    expect(within(index).getByRole('link', { name: 'Sankofa' })).toHaveAttribute('aria-current', 'location')
  })

  it('keeps the chip bar and the section anchors clear of the taller desktop header', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('navigation', { name: 'Nesta página' })).toHaveClass('top-15', 'desktop:top-19')
    for (const id of ['sankofa', 'quem-idealizou', 'missao', 'setores', 'onde-estamos']) {
      expect(document.getElementById(id)).toHaveClass('scroll-mt-32', 'desktop:scroll-mt-40')
    }
  })

  it('shows Sankofa and the founders with the placeholders of screen 5b', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('heading', { name: 'Sankofa' }).closest('section')).toHaveAttribute('id', 'sankofa')
    expect(screen.getByText('"Nunca é tarde para voltar e apanhar aquilo que ficou para trás."')).toBeInTheDocument()
    expect(screen.getByText('Símbolo Sankofa', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wil Oliveira e Nathália (Nathy) Monteiro' })).toBeInTheDocument()
    expect(screen.getByText('Foto de Wil e Nathy')).toBeInTheDocument()
    expect(screen.getByText('Janeiro de 2020')).toBeInTheDocument()
    expect(screen.getByText('O ateliê ganha sede na Casa Verde, segundo a Folha de S.Paulo.')).toBeInTheDocument()
    for (const id of ['sankofa', 'quem-idealizou']) expect(document.getElementById(id)).toHaveClass('scroll-mt-32')
  })

  it('lets the Sankofa symbol and name wrap onto two lines, and the long words break, so the largest text size does not push the page sideways', () => {
    renderRoute('/quem-somos')

    const title = screen.getByRole('heading', { name: 'Sankofa' })
    expect(title.parentElement?.parentElement).toHaveClass('flex-wrap')
    expect(title.parentElement).toHaveClass('min-w-0', 'basis-40')
    expect(title).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('[overflow-wrap:anywhere]')
  })

  it('shows the mission and the values in the ONG\'s own words, as the values the form lists', () => {
    renderRoute('/quem-somos')

    const section = document.getElementById('missao')!
    expect(within(section).getByRole('heading', { level: 2, name: 'Missão e valores' })).toBeInTheDocument()
    expect(within(section).getByText(/promover a valorização da cultura e da memória afro-brasileira por meio da arte, da educação e das vivências artísticas culturais/)).toBeInTheDocument()
    expect(within(section).getByText(/construção de uma sociedade mais justa, consciente e antirracista/)).toBeInTheDocument()
    expect(within(section).getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'ancestralidade',
      'respeito à diversidade',
      'valorização da cultura e da memória afro-brasileira',
      'respeito como instrumento de transformação social',
      'equidade',
      'ética',
      'coletividade',
      'afeto',
      'inclusão',
      'fortalecimento da identidade, da autoestima e do pertencimento',
    ])
  })

  it('shows the three sectors with their photos and the audience statement', () => {
    renderRoute('/quem-somos')

    const sectors = document.getElementById('setores')!
    expect(within(sectors).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual([
      'Literário',
      'Musical',
      'Artístico criativo',
    ])
    expect(within(sectors).getAllByRole('img')).toHaveLength(3)
    for (const rhythm of ['jongo', 'maculelê', 'maracatu', 'forró', 'samba', 'rap', 'hip hop', 'funk']) {
      expect(within(sectors).getByText(rhythm)).toBeInTheDocument()
    }
    expect(within(sectors).queryAllByRole('link')).toHaveLength(0)
    expect(screen.getByText('Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.')).toBeInTheDocument()
  })

  it('shows where the ateliê is, with an embedded map and directions', () => {
    renderRoute('/quem-somos')

    const location = document.getElementById('onde-estamos')!
    expect(within(location).getByRole('heading', { name: 'Casa Verde, zona norte de São Paulo' })).toBeInTheDocument()
    expect(within(location).getByTitle('Mapa: Rua Dr. Paulo Gatti, 135 — Vila Romero')).toHaveAttribute(
      'src',
      expect.stringContaining('https://www.google.com/maps?q=Rua%20Dr.%20Paulo%20Gatti'),
    )
    expect(within(location).getByRole('link', { name: /Como chegar/ })).toHaveAttribute(
      'href',
      expect.stringContaining('https://www.google.com/maps/dir/?api=1&destination='),
    )
  })

  it('closes with the three calls to action of screen 5b', () => {
    renderRoute('/quem-somos')

    const cta = screen.getByRole('heading', { name: 'Quer fazer parte desta história?' }).closest('section')!
    expect(within(cta).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Conhecer nossos projetos', '/projetos'],
      ['Ser voluntário', '/voluntariado'],
      ['Apoiar', '/doar'],
    ])
  })

  it('marks the chip of the section on screen', () => {
    let notify: IntersectionObserverCallback = () => {}
    vi.stubGlobal(
      'IntersectionObserver',
      class {
        constructor(callback: IntersectionObserverCallback) {
          notify = callback
        }
        observe() {}
        disconnect() {}
      },
    )
    renderRoute('/quem-somos')

    const target = document.getElementById('onde-estamos')!
    act(() =>
      notify([{ isIntersecting: true, target, boundingClientRect: { top: 10 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver),
    )

    const index = screen.getByRole('navigation', { name: 'Nesta página' })
    expect(within(index).getByRole('link', { name: 'Onde estamos' })).toHaveAttribute('aria-current', 'location')
    expect(within(index).getByRole('link', { name: 'Sankofa' })).not.toHaveAttribute('aria-current')
    vi.unstubAllGlobals()
  })

  it('gives every image a text alternative attribute', () => {
    renderRoute('/quem-somos')
    for (const image of screen.getByRole('main').querySelectorAll('img')) expect(image).toHaveAttribute('alt')
  })
})
