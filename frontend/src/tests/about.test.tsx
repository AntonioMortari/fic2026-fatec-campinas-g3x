import { act, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { renderRoute } from './render'

function desktop() {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('64rem'),
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  }))
}

afterEach(() => vi.unstubAllGlobals())

const SECTION_IDS = ['sankofa', 'quem-idealizou', 'setores', 'para-quem', 'onde-estamos']

describe('About page, on the phone (design 15b)', () => {
  it('opens on the mission sentence, with the photo and the one-line summary', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Um espaço educativo de reflexão, criação e valorização da cultura e memória afro-brasileira',
    )
    expect(screen.getByText('Quem somos', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getByText('Casa Verde, zona norte de São Paulo · desde 2020')).toBeInTheDocument()
    expect(screen.getByAltText('Wil Oliveira em cena, com saia de palha, tocando berimbau.')).toBeInTheDocument()
  })

  it('lists the five sections as anchors below the photo, Sankofa marked as the current one', () => {
    renderRoute('/quem-somos')

    const index = screen.getByRole('navigation', { name: 'Nesta página' })
    const links = within(index).getAllByRole('link')
    expect(links.map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
      ['Sankofa', '#sankofa'],
      ['Quem idealizou', '#quem-idealizou'],
      ['Setores', '#setores'],
      ['Para quem', '#para-quem'],
      ['Onde estamos', '#onde-estamos'],
    ])
    expect(within(index).getByRole('link', { name: 'Sankofa' })).toHaveAttribute('aria-current', 'location')
    expect(screen.getByRole('heading', { level: 1 }).compareDocumentPosition(index) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('keeps the chip bar and the section anchors clear of the header', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('navigation', { name: 'Nesta página' })).toHaveClass('sticky', 'top-15')
    for (const id of SECTION_IDS) expect(document.getElementById(id)).toHaveClass('scroll-mt-32', 'desktop:scroll-mt-40')
  })

  it('has no section the design does not have, and no text the design does not have', () => {
    renderRoute('/quem-somos')

    expect(screen.queryByText('Missão e valores')).not.toBeInTheDocument()
    expect(screen.queryByText(/segundo a Folha/)).not.toBeInTheDocument()
    expect(document.getElementById('missao')).toBeNull()
  })

  it('shows Sankofa on the one dark band, with the quote and the placeholder for the ONG\'s art', () => {
    renderRoute('/quem-somos')

    const band = document.getElementById('sankofa')!
    expect(band).toHaveClass('bg-brown')
    expect(within(band).getByRole('heading', { level: 2, name: 'Sankofa' })).toBeInTheDocument()
    expect(within(band).getByText('“Nunca é tarde para voltar e apanhar aquilo que ficou para trás.”')).toBeInTheDocument()
    expect(within(band).getByText('Símbolo Sankofa', { exact: false })).toBeInTheDocument()
    expect(within(band).getByText(/Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda/)).toBeInTheDocument()
  })

  it('lets the Sankofa symbol and name wrap onto two lines, and the long words break, so the largest text size does not push the page sideways', () => {
    renderRoute('/quem-somos')

    const title = screen.getByRole('heading', { name: 'Sankofa' })
    expect(title.parentElement?.parentElement).toHaveClass('flex-wrap')
    expect(title.parentElement).toHaveClass('min-w-0', 'basis-40')
    expect(title).toHaveClass('[overflow-wrap:anywhere]')
    expect(screen.getByRole('heading', { level: 1 })).toHaveClass('[overflow-wrap:anywhere]')
  })

  it('shows who idealized it: the photo placeholder, the short text, the seven skills and the two milestones', () => {
    renderRoute('/quem-somos')

    const section = document.getElementById('quem-idealizou')!
    expect(within(section).getByRole('heading', { name: 'Wil Oliveira e Nathália (Nathy) Monteiro' })).toBeInTheDocument()
    expect(within(section).getByText('Foto de Wil e Nathy')).toBeInTheDocument()
    expect(within(section).getByText('Um casal de artistas e os idealizadores da instituição. Juntos somam pesquisa sobre a cultura afro-brasileira e a cultura popular:')).toBeInTheDocument()
    const skills = within(section).getAllByRole('listitem').map((item) => item.textContent)
    expect(skills.slice(0, 7)).toEqual(['Pesquisa', 'Contação de histórias', 'Cultura popular brincante', 'Dança', 'Música', 'Atuação', 'Escrita'])
    expect(within(section).getByText('Janeiro de 2020')).toBeInTheDocument()
    expect(within(section).getByText('O ateliê ganha sede na Casa Verde.')).toBeInTheDocument()
    expect(within(section).getByText('Rede nacional')).toBeInTheDocument()
    expect(within(section).getByText('O casal participa do Caldeirão do Huck, na Rede Globo, na véspera do Dia Internacional Contra a Discriminação Racial.')).toBeInTheDocument()
  })

  it('shows the three sectors with their photos, the colour of each on the top edge, and the rhythms of the musical one', () => {
    renderRoute('/quem-somos')

    const sectors = document.getElementById('setores')!
    expect(within(sectors).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Literário', 'Musical', 'Artístico criativo'])
    expect(within(sectors).getAllByRole('img')).toHaveLength(3)
    const cards = sectors.querySelectorAll(':scope > ul > li')
    expect([...cards].slice(0, 3).map((card) => ['border-t-ochre', 'border-t-blue', 'border-t-brown'].find((name) => card.classList.contains(name)))).toEqual([
      'border-t-ochre',
      'border-t-blue',
      'border-t-brown',
    ])
    for (const rhythm of ['jongo', 'maculelê', 'maracatu', 'forró', 'samba', 'rap', 'hip hop', 'funk']) {
      expect(within(sectors).getByText(rhythm)).toBeInTheDocument()
    }
    expect(within(sectors).queryAllByRole('link')).toHaveLength(0)
  })

  it('has "Para quem" as its own section, between the sectors and the place', () => {
    renderRoute('/quem-somos')

    const audience = document.getElementById('para-quem')!
    expect(within(audience).getByText('Para quem')).toBeInTheDocument()
    expect(within(audience).getByText('Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.')).toBeInTheDocument()
  })

  it('shows where the ateliê is: the short text, the notice, the map with its privacy line, the address and directions', () => {
    renderRoute('/quem-somos')

    const place = document.getElementById('onde-estamos')!
    expect(within(place).getByRole('heading', { name: 'Casa Verde, zona norte de São Paulo' })).toBeInTheDocument()
    expect(within(place).getByText(/Daqui propomos atividades que aproximam as crianças da riqueza cultural afro-brasileira/)).toBeInTheDocument()
    expect(within(place).getByText('Sabemos que há necessidade de trabalhar e conscientizar o público infantil acerca das práticas e representações que configuram o racismo.')).toBeInTheDocument()
    expect(within(place).getByTitle('Mapa: Rua Dr. Paulo Gatti, 135 — Vila Romero')).toHaveAttribute(
      'src',
      expect.stringContaining('https://www.google.com/maps?q=Rua%20Dr.%20Paulo%20Gatti'),
    )
    expect(within(place).getByText(/O mapa é carregado do Google\. Como isso afeta sua privacidade\./)).toBeInTheDocument()
    expect(within(place).getByText('Rua Dr. Paulo Gatti, 135 — Vila Romero')).toBeInTheDocument()
    expect(within(place).getByRole('link', { name: /Como chegar/ })).toHaveAttribute('href', expect.stringContaining('https://www.google.com/maps/dir/?api=1&destination='))
  })

  it('closes with the question on a card, and the three calls to action', () => {
    renderRoute('/quem-somos')

    const heading = screen.getByRole('heading', { name: 'Quer fazer parte desta história?' })
    const card = heading.closest('section')!
    expect(card).toHaveClass('bg-card', 'border-brown')
    expect(within(card).getAllByRole('link').map((link) => [link.textContent, link.getAttribute('href')])).toEqual([
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
    act(() => notify([{ isIntersecting: true, target, boundingClientRect: { top: 10 } } as unknown as IntersectionObserverEntry], {} as IntersectionObserver))

    const index = screen.getByRole('navigation', { name: 'Nesta página' })
    expect(within(index).getByRole('link', { name: 'Onde estamos' })).toHaveAttribute('aria-current', 'location')
    expect(within(index).getByRole('link', { name: 'Sankofa' })).not.toHaveAttribute('aria-current')
  })

  it('gives every image a text alternative attribute', () => {
    renderRoute('/quem-somos')
    for (const image of screen.getByRole('main').querySelectorAll('img')) expect(image).toHaveAttribute('alt')
  })
})

describe('About page, on the desktop (design 15a)', () => {
  it('puts the index inside the opening block, under the sentence, and says the headquarters date in full', () => {
    desktop()
    renderRoute('/quem-somos')

    const hero = screen.getByRole('heading', { level: 1 }).closest('section')!
    expect(within(hero).getByText('Casa Verde, zona norte de São Paulo · sede desde janeiro de 2020')).toBeInTheDocument()
    const index = within(hero).getByRole('navigation', { name: 'Nesta página' })
    expect(within(index).getAllByRole('link')).toHaveLength(5)
    expect(index).not.toHaveClass('sticky')
    expect(screen.getAllByRole('navigation', { name: 'Nesta página' })).toHaveLength(1)
  })

  it('tells who idealized it in the longer text of the desktop design', () => {
    desktop()
    renderRoute('/quem-somos')

    const section = document.getElementById('quem-idealizou')!
    expect(
      within(section).getByText(
        'Um casal de artistas e os idealizadores da instituição. Juntos somam habilidades artísticas como pesquisa acerca da cultura afro-brasileira, contação de histórias, brincantes de cultura popular, dança, música, atuação e escrita, sempre envolvendo a temática afro-brasileira e a cultura popular.',
      ),
    ).toBeInTheDocument()
  })

  it('tells where the ateliê is in the full text of the desktop design', () => {
    desktop()
    renderRoute('/quem-somos')

    const place = document.getElementById('onde-estamos')!
    expect(
      within(place).getByText(
        'Um lugar de grande e importantíssima historicidade e presença negra. O ateliê propõe atividades que possibilitam aproximar as crianças da riqueza cultural afro-brasileira, aprofundando o estudo das raízes culturais africanas, visando elevar o respeito e a autoestima da criança, na sua percepção e atuação sobre si mesma e seu lugar no mundo.',
      ),
    ).toBeInTheDocument()
  })
})
