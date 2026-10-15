import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Home } from '../pages/Home'
import { PAST_VENUES } from '../lib/schools'
import { PressSection } from '../components/home/PressSection'
import type { HomePhoto } from '../lib/gallery'
import type { NewsItem } from '../types/news'
import { renderRoute, renderWithRouter } from './render'

const EVENT = {
  id: 'cafu-e-o-cafe',
  title: 'Cafú e o Café',
  description: null,
  category: 'Contação de história',
  startsAt: '2026-10-17T17:00:00Z',
  endsAt: '2026-10-17T18:30:00Z',
  location: 'Sede, Vila Romero',
  ageRange: 'Livre',
  capacity: 18,
  spotsLeft: 12,
  registrationOnSite: true,
  registrationStatus: 'open' as const,
  image: null,
}

const photo = (n: number, album = `Álbum ${n}`): HomePhoto => ({ id: `p${n}`, url: `/api/gallery/p${n}/image?v=1`, alt: `Descrição da foto ${n}`, album })
const PHOTOS = [1, 2, 3, 4, 5].map((n) => photo(n, n === 1 ? 'II Festa Preta' : `Álbum ${n}`))

const item = (n: number, overrides: Partial<NewsItem> = {}): NewsItem => ({
  id: `n${n}`,
  kind: 'news',
  title: `Notícia ${n}`,
  excerpt: `Chamada da notícia ${n}.`,
  publishedAt: `2026-10-0${n}T15:00:00.000Z`,
  image: null,
  ...overrides,
})
const NEWS = [item(3, { kind: 'campaign', image: { url: '/api/news/n3/image?v=1', alt: 'Imagem da campanha' } }), item(2), item(1)]

describe('home page: the opening (designs 14a and 14b)', () => {
  it('opens with the heading and a single main action, and the way to the agenda', () => {
    renderRoute('/')
    const hero = screen.getByRole('region', { name: /Arte, memória e pertencimento/ })

    expect(within(hero).getByRole('link', { name: 'Conhecer nossos projetos' })).toHaveAttribute('href', '/projetos')
    expect(within(hero).getByRole('link', { name: /Ver a agenda/ })).toHaveAttribute('href', '/agenda')
    expect(within(hero).getByRole('img')).toHaveAccessibleName(/Wil Oliveira/)
  })

  it('does not invent a next activity when there is no published event', () => {
    renderRoute('/')

    expect(screen.queryByRole('region', { name: 'Próxima atividade' })).not.toBeInTheDocument()
  })

  it('shows the next activity as a card: date, category, title, the long and the short line, and the way in', () => {
    renderWithRouter(<Home nextEvent={EVENT} />)
    const section = screen.getByRole('region', { name: 'Próxima atividade' })

    expect(within(section).getByRole('heading', { name: 'Cafú e o Café' })).toBeInTheDocument()
    expect(within(section).getByText('sábado, 17 de outubro')).toBeInTheDocument()
    expect(within(section).getByText('Contação de história')).toBeInTheDocument()
    expect(within(section).getByText('Sábado, 14h às 15h30 · Sede, Vila Romero · Livre · Restam 12 vagas')).toBeInTheDocument()
    expect(within(section).getByText('14h · Sede, Vila Romero · Livre')).toBeInTheDocument()
    expect(within(section).getByRole('link', { name: 'Quero me inscrever' })).toHaveAttribute('href', '/agenda/cafu-e-o-cafe/inscricao')
    expect(within(section).getByRole('link', { name: 'Toda a agenda →' })).toHaveAttribute('href', '/agenda')
  })

  it('says the spots are over, with no sign-up link but the way to the details, when none is left', () => {
    renderWithRouter(<Home nextEvent={{ ...EVENT, capacity: 5, spotsLeft: 0, registrationStatus: 'full' }} />)
    const section = screen.getByRole('region', { name: 'Próxima atividade' })

    expect(within(section).queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument()
    expect(within(section).getAllByText('Vagas esgotadas').length).toBeGreaterThan(0)
    expect(within(section).getAllByRole('link', { name: /Ver detalhes|Detalhes/ })[0]).toHaveAttribute('href', '/agenda/cafu-e-o-cafe')
  })

  it.each(['not_on_site', 'unknown'] as const)('does not offer the sign-up link when the status is %s, only the details', (registrationStatus) => {
    renderWithRouter(<Home nextEvent={{ ...EVENT, registrationStatus }} />)
    const section = screen.getByRole('region', { name: 'Próxima atividade' })

    expect(within(section).queryByRole('link', { name: 'Quero me inscrever' })).not.toBeInTheDocument()
    expect(within(section).queryByText('Vagas esgotadas')).not.toBeInTheDocument()
    expect(within(section).getAllByRole('link', { name: /Ver detalhes|Detalhes/ })[0]).toHaveAttribute('href', '/agenda/cafu-e-o-cafe')
  })
})

describe('home page: where to start and what we do', () => {
  it('offers the four starting points as cards, in order, each one a link with its colour on the top edge', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Por onde começar' })

    const links = within(section).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['/quem-somos', '/agenda', '/voluntariado', '/doar'])
    expect(links.map((link) => ['border-t-ochre', 'border-t-blue', 'border-t-brown-400'].find((name) => link.classList.contains(name)))).toEqual([
      'border-t-ochre',
      'border-t-blue',
      'border-t-brown-400',
      'border-t-ochre',
    ])
    expect(links[3]).toHaveClass('bg-brown', 'text-cream')
    expect(within(section).getAllByText('Quem somos', { selector: 'span' })).not.toHaveLength(0)
    for (const label of ['Ver a agenda', 'Áreas de atuação', 'Como apoiar']) expect(within(section).getByText(label)).toBeInTheDocument()
  })

  it('says what "Apoiar" is for with the needs the ONG listed in the form, not goods nobody asked for', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Por onde começar' })

    expect(within(section).getByText('Recursos para manter as atividades, a equipe e os materiais.')).toBeInTheDocument()
    expect(within(section).queryByText(/instrumentos/)).not.toBeInTheDocument()
  })

  it('shows the three sectors with described photos, and the way to the full story', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'O que fazemos' })

    expect(within(section).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(['Literário', 'Musical', 'Artístico criativo'])
    for (const image of within(section).getAllByRole('img')) expect(image).toHaveAccessibleName(/\S/)
    expect(within(section).getByRole('link', { name: 'Ler nossa história completa →' })).toHaveAttribute('href', '/quem-somos')
    expect(within(section).getByText('deslize →')).toBeInTheDocument()
  })
})

describe('home page: our story', () => {
  it('puts Sankofa and who idealized the ateliê up front, and sends to the full page', () => {
    renderRoute('/')
    const story = screen.getByRole('region', { name: 'Nossa história' })

    expect(within(story).getByText('“Nunca é tarde para voltar e apanhar aquilo que ficou para trás.”')).toBeInTheDocument()
    expect(within(story).getByText(/Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda/)).toBeInTheDocument()
    expect(within(story).getByText('Wil Oliveira e Nathália (Nathy) Monteiro')).toBeInTheDocument()
    expect(within(story).getByText('Um casal de artistas, idealizadores da instituição. O ateliê ganhou sede na Casa Verde em janeiro de 2020.')).toBeInTheDocument()
    expect(within(story).getByRole('link', { name: 'Conhecer quem somos' })).toHaveAttribute('href', '/quem-somos')
    expect(within(story).getByRole('img')).toHaveAccessibleName(/Wil Oliveira em cena/)
  })
})

describe('home page: from the gallery', () => {
  it('shows the most recent photos, the first one with the name of its album, and goes to all the albums', () => {
    renderWithRouter(<Home photos={PHOTOS} />)
    const section = screen.getByRole('region', { name: 'Da galeria' })

    expect(within(section).getAllByRole('img')).toHaveLength(5)
    expect(within(section).getByRole('img', { name: 'Descrição da foto 1' })).toHaveAttribute('src', expect.stringContaining('/api/gallery/p1/image?v=1'))
    expect(within(section).getByText('II Festa Preta')).toBeInTheDocument()
    for (const link of within(section).getAllByRole('link', { name: /Ver todos os álbuns/ })) expect(link).toHaveAttribute('href', '/galeria')
  })

  it('disappears when no photo is on air, instead of showing an empty frame', () => {
    renderWithRouter(<Home photos={[]} />)

    expect(screen.queryByRole('region', { name: 'Da galeria' })).not.toBeInTheDocument()
    expect(screen.queryByText(/Ver todos os álbuns/)).not.toBeInTheDocument()
  })
})

describe('home page: news and campaigns', () => {
  it('shows the latest ones, with the campaign marked and the date written in full, each a link to its page', () => {
    renderWithRouter(<Home news={NEWS} />)
    const section = screen.getByRole('region', { name: 'Notícias e campanhas' })

    expect(within(section).getAllByRole('heading', { level: 3 }).map((heading) => heading.textContent)).toEqual(['Notícia 3', 'Notícia 2', 'Notícia 1'])
    expect(within(section).getByRole('link', { name: 'Notícia 3' })).toHaveAttribute('href', '/noticias/n3')
    expect(within(section).getAllByText('Campanha')).not.toHaveLength(0)
    expect(within(section).getAllByText('3 de outubro de 2026')).not.toHaveLength(0)
    expect(within(section).getAllByText('Chamada da notícia 3.')).not.toHaveLength(0)
    for (const link of within(section).getAllByRole('link', { name: 'Todas as notícias →' })) expect(link).toHaveAttribute('href', '/noticias')
  })

  it('never shows more than three', () => {
    renderWithRouter(<Home news={[item(5), item(4), ...NEWS]} />)

    expect(within(screen.getByRole('region', { name: 'Notícias e campanhas' })).getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  it('disappears when nothing is published', () => {
    renderWithRouter(<Home news={[]} />)

    expect(screen.queryByRole('region', { name: 'Notícias e campanhas' })).not.toBeInTheDocument()
  })
})

describe('home page: schools, where we have been and where we are', () => {
  it('points schools to the schools page', () => {
    renderRoute('/')

    expect(within(screen.getByRole('region', { name: 'É de uma escola ou instituição?' })).getByRole('link', { name: 'Ver como funciona' })).toHaveAttribute('href', '/para-escolas')
  })

  it('lists the places the ONG has been, the same ones the schools page has, with the detail where there is one', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Onde já estivemos' })

    expect(within(section).getAllByRole('listitem')).toHaveLength(PAST_VENUES.length)
    expect(within(section).getByText('Paço Cultural Santo Amaro')).toBeInTheDocument()
    expect(within(section).queryByText(/SESC Santo Amaro|São Rafael/)).not.toBeInTheDocument()
    for (const link of within(section).getAllByRole('link', { name: 'Levar uma atividade para a sua escola →' })) expect(link).toHaveAttribute('href', '/para-escolas')
  })

  it('shows where we are: the text, the address, the postal code, the map with its privacy line, and the two ways to get there', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Onde estamos' })

    expect(within(section).getByText(/Ficamos no bairro da Casa Verde, zona norte de São Paulo/)).toBeInTheDocument()
    expect(within(section).getAllByText('Rua Dr. Paulo Gatti, 135 — Vila Romero').length).toBeGreaterThan(0)
    expect(within(section).getAllByText('São Paulo/SP — CEP 02468-030').length).toBeGreaterThan(0)
    expect(within(section).getByTitle('Mapa: Rua Dr. Paulo Gatti, 135 — Vila Romero')).toHaveAttribute('src', expect.stringContaining('https://www.google.com/maps?q='))
    expect(within(section).getByText(/O mapa é carregado do Google\. Como isso afeta sua privacidade\./)).toBeInTheDocument()
    for (const link of within(section).getAllByRole('link', { name: /Como chegar/ })) expect(link).toHaveAttribute('href', expect.stringContaining('https://www.google.com/maps/dir/?api=1&destination='))
    for (const link of within(section).getAllByRole('link', { name: /WhatsApp/ })) expect(link).toHaveAttribute('href', 'https://wa.me/5511953968344')
  })
})

describe('home page: in the press', () => {
  it('shows what the ONG has been in the press, from its own material: the Folha story as the highlight and the Globo appearance beside it', () => {
    renderRoute('/')
    const section = screen.getByRole('region', { name: 'Na mídia' })

    expect(within(section).getByText('Folha de S.Paulo')).toBeInTheDocument()
    expect(within(section).getByText('“Como o menino que era caixa de supermercado criou um ateliê para valorizar a cultura negra”')).toBeInTheDocument()
    expect(within(section).getByText('Rede Globo · 2021')).toBeInTheDocument()
    expect(within(section).getByText('Caldeirão do Huck · quadro The Wall')).toBeInTheDocument()
    expect(within(section).getByText('Participação em rede nacional')).toBeInTheDocument()
    expect(within(section).getByText('Gshow · 2021')).toBeInTheDocument()
    expect(within(section).getByText('Participante do The Wall faz discurso emocionante contra o racismo')).toBeInTheDocument()
  })

  it('links each piece to its original, the ones the team gave, in a new tab', () => {
    renderRoute('/')
    const links = within(screen.getByRole('region', { name: 'Na mídia' })).getAllByRole('link')

    expect(links.map((link) => [link.textContent?.replace(/\s+/g, ' ').trim(), link.getAttribute('href')])).toEqual([
      ['Ler a matéria na Folha ↗ (abre em outra aba)', 'https://pitacocultural.blogfolha.uol.com.br/2021/03/30/como-o-menino-que-era-caixa-de-supermercado-criou-um-atelie-para-valorizar-a-cultura-negra/'],
      ['Assistir no Globoplay ↗ (abre em outra aba)', 'https://globoplay.globo.com/v/9362917/'],
      ['Ler a matéria no Gshow ↗ (abre em outra aba)', 'https://gshow.globo.com/programas/caldeirao-do-huck/the-wall/noticia/participante-do-the-wall-faz-discurso-emocionante-contra-o-racismo-estamos-perdendo-as-nossas-criancas.ghtml'],
    ])
    for (const link of links) expect(link).toHaveAttribute('target', '_blank')
  })

  it('opens the original in a new tab, saying so, as soon as an address is given', () => {
    renderWithRouter(
      <PressSection
        featured={{ outlet: 'Veículo', quote: 'Título da matéria', url: 'https://exemplo.com/materia', action: 'Ler a matéria' }}
        others={[{ outlet: 'Outro', year: '2021', title: 'Programa', detail: 'Participação', url: 'https://exemplo.com/video', action: 'Assistir' }]}
      />,
    )
    const section = screen.getByRole('region', { name: 'Na mídia' })

    const links = within(section).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['https://exemplo.com/materia', 'https://exemplo.com/video'])
    for (const link of links) {
      expect(link).toHaveAttribute('target', '_blank')
      expect(link).toHaveAttribute('rel', expect.stringContaining('noreferrer'))
      expect(link).toHaveTextContent(/abre em outra aba/)
    }
  })

  it('disappears when there is nothing to show', () => {
    renderWithRouter(<PressSection featured={null} others={[]} />)

    expect(screen.queryByRole('region', { name: 'Na mídia' })).not.toBeInTheDocument()
  })
})

describe('home page: what the design has and the site cannot yet', () => {
  it('has no testimonials (there is no way to send or approve one)', () => {
    renderRoute('/')

    expect(screen.queryByRole('heading', { name: 'Quem já participou' })).not.toBeInTheDocument()
    expect(screen.queryByText('Contar como foi')).not.toBeInTheDocument()
  })

  it('keeps the order of the design: opening, next activity, where to start, what we do, story, gallery, schools, news, press, places, where we are', () => {
    renderWithRouter(<Home nextEvent={EVENT} photos={PHOTOS} news={NEWS} />)

    const names = ['Arte, memória e pertencimento', 'Próxima atividade', 'Por onde começar', 'O que fazemos', 'Nossa história', 'Da galeria', 'É de uma escola ou instituição?', 'Notícias e campanhas', 'Na mídia', 'Onde já estivemos', 'Onde estamos']
    const regions = names.map((name) => screen.getByRole('region', { name: name === names[0] ? /Arte, memória e pertencimento/ : name }))
    for (let index = 1; index < regions.length; index += 1) {
      expect(regions[index - 1]!.compareDocumentPosition(regions[index]!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    }
  })
})
