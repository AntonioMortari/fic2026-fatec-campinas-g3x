# Sobre, Projetos e Detalhe do projeto — Plano de implementação

> **Para quem executa:** SUB-SKILL OBRIGATÓRIA: `superpowers:executing-plans` (execução inline, na sessão), seguindo o
> protocolo do Yuri a cada tarefa: explicar antes → esperar o "pode" → bloco pequeno com TDD → relatório (arquivos,
> trechos, fluxo de dados, testes) → 1–2 perguntas de entendimento → próxima tarefa. **Sem commit, push ou PR** até o
> Yuri validar o pacote inteiro do PR. Passos usam checkbox (`- [ ]`).

**Objetivo:** recriar na V2 as páginas `/quem-somos`, `/projetos` e `/projetos/:slug`, fiéis às telas 5b, 3b e 3c.

**Arquitetura:** Sobre é só frontend (conteúdo estático do design). Projetos e Detalhe ganham uma tabela `projects`
(carregada com os 11 projetos na própria migration) e uma API pública de leitura, no mesmo padrão de camadas de eventos
(routes → controller com Zod → service → model). O frontend consome com React Query e monta as telas com os
componentes de `components/ui` e os layouts existentes.

**Stack:** React 19 + Vite + TypeScript + Tailwind 4 + React Query + Axios + react-router-dom 7 (frontend);
Node 22 + Express 5 + Zod 4 + Sequelize 6 + Umzug + MySQL 8.4 (backend); Vitest + Testing Library; Jest + supertest.

**Spec:** `docs/superpowers/specs/2026-10-09-about-and-projects-pages-design.md`

## Restrições globais

- Fidelidade total às telas 5b, 3b e 3c (`Análise UX-UI da migração Next.js/Analise UX-UI.dc.html`), inclusive textos.
- Cores sempre por token (`brown`, `ochre-deep`, `brown-400`, `brown-600`, `cream-dim`, `cream-dark`, `card`,
  `blue-deep`, `ochre`, `line`) — nunca hex no código. Texto em `rem`, nunca `px` nem `vw`.
- `cn()` só concatena (não resolve conflito): nunca passar duas classes que disputam a mesma propriedade.
- Alvo de toque ≥ 44px (`min-h-11`); botão principal 52px (`min-h-13`).
- Código, nomes de arquivo e identificadores em inglês; textos de interface e docs em português.
- Comentário só para o "porquê" que o código não mostra.
- Cabeçalho, rodapé e barras vêm dos layouts (`Layout`, `FocusedLayout`); páginas não os recriam.
- Commits (quando autorizados): Conventional Commits em inglês, sem trailer de coautoria; uma branch por PR, a partir
  da `main` atualizada.
- Rodar antes de declarar pronto: `npm test` e `npm run typecheck` em `backend/` e `frontend/`, `npm run lint` em
  `frontend/`, e `npm run test:db` em `backend/` quando houver banco.

## Foco de revisão

1. Slug digitado fora do padrão (`/projetos/Banzo`, `/projetos/çãõ`) → a API responde 400; a página deve mostrar
   "Página não encontrada", não o erro de conexão. *(teste na Tarefa 15)*
2. Projeto sem `genre` nem `duration` → a lista não renderiza um rótulo vazio. *(teste na Tarefa 10)*
3. "Compartilhar" cancelado pela pessoa (`navigator.share` rejeita com `AbortError`) → nenhum aviso de erro aparece.
   *(teste na Tarefa 14)*
4. Projeto tirado do ar acessado pelo link antigo → 404 na API e "Página não encontrada" na tela. *(testes nas
   Tarefas 13 e 15)*
5. Âncora do índice do Sobre caindo embaixo do cabeçalho e dos chips fixos → cada seção tem `scroll-mt-32`.
   *(teste na Tarefa 3 confere a classe; conferência visual na Tarefa 7)*

---

# PR 1 — Sobre (`feat/about-page`)

### Tarefa 0: Preparar a branch

- [ ] **Passo 1:** conferir que não há mudança local além do spec e do plano: `git status`.
- [ ] **Passo 2:** atualizar e criar a branch:

```bash
git switch main && git pull --ff-only
git switch -c feat/about-page
```

Esperado: `Switched to a new branch 'feat/about-page'` (o spec e o plano vêm junto, sem commit).

- [ ] **Passo 3:** instalar dependências se ainda não houver `node_modules`: `npm ci` em `frontend/`.

### Tarefa 1: Constantes de navegação e módulo de setores

**Por quê:** o Sobre e o Detalhe linkam para `/projetos`, `/voluntariado` e `/para-escolas`; hoje só `/doar`
(`SUPPORT`) tem constante. Os setores (imagem + alt) estão presos dentro de `WhatWeDo.tsx` e o Sobre precisa deles.

**Arquivos:**
- Modificar: `frontend/src/lib/navigation.ts`
- Criar: `frontend/src/lib/sectors.ts`
- Modificar: `frontend/src/components/home/WhatWeDo.tsx:1-25` e o `map` (linhas ~40-48)
- Teste: `frontend/src/tests/navigation.test.ts` (novo)

**Interfaces:**
- Produz: `PROJECTS`, `VOLUNTEER`, `SCHOOLS: Destination`; `SectorKey`, `Sector`, `SECTORS: Sector[]`.

- [ ] **Passo 1: teste que falha** — `frontend/src/tests/navigation.test.ts`

```ts
import { BOTTOM_BAR, DESKTOP_NAV, MENU_GROUPS, PROJECTS, SCHOOLS, VOLUNTEER } from '../lib/navigation'
import { SECTORS } from '../lib/sectors'

describe('navigation constants', () => {
  it('names the destinations the about and project pages link to', () => {
    expect(PROJECTS).toEqual({ label: 'Projetos', to: '/projetos' })
    expect(VOLUNTEER).toEqual({ label: 'Voluntariado', to: '/voluntariado' })
    expect(SCHOOLS).toEqual({ label: 'Para escolas', to: '/para-escolas' })
  })

  it('keeps the menus pointing to the same objects', () => {
    expect(BOTTOM_BAR).toContain(PROJECTS)
    expect(DESKTOP_NAV).toContain(PROJECTS)
    expect(MENU_GROUPS.flatMap((group) => group.items)).toEqual(expect.arrayContaining([PROJECTS, VOLUNTEER, SCHOOLS]))
  })
})

describe('sectors', () => {
  it('lists the three sectors with a photo and a description of it', () => {
    expect(SECTORS.map((sector) => sector.key)).toEqual(['literary', 'musical', 'artistic'])
    for (const sector of SECTORS) expect(sector.alt.length).toBeGreaterThan(20)
  })
})
```

- [ ] **Passo 2: rodar e ver falhar** — `cd frontend && npx vitest run src/tests/navigation.test.ts`
  Esperado: FAIL (`PROJECTS` não exportado / módulo `../lib/sectors` não existe).

- [ ] **Passo 3: implementar** — em `frontend/src/lib/navigation.ts`, trocar o bloco de constantes:

```ts
export const HOME: Destination = { label: 'Início', to: '/' }
export const SUPPORT: Destination = { label: 'Apoiar', to: '/doar' }
export const PROJECTS: Destination = { label: 'Projetos', to: '/projetos' }
export const VOLUNTEER: Destination = { label: 'Voluntariado', to: '/voluntariado' }
export const SCHOOLS: Destination = { label: 'Para escolas', to: '/para-escolas' }

export const BOTTOM_BAR: Destination[] = [HOME, { label: 'Agenda', to: '/agenda' }, PROJECTS]

export const DESKTOP_NAV: Destination[] = [
  HOME,
  { label: 'Agenda', to: '/agenda' },
  PROJECTS,
  { label: 'Quem somos', to: '/quem-somos' },
]
```

e, em `MENU_GROUPS`, usar `PROJECTS` no grupo "Conhecer" e `VOLUNTEER` e `SCHOOLS` no grupo "Participar" no lugar
dos objetos literais equivalentes.

Criar `frontend/src/lib/sectors.ts`:

```ts
export type SectorKey = 'literary' | 'musical' | 'artistic'

export interface Sector {
  key: SectorKey
  title: string
  image: string
  alt: string
}

export const SECTORS: Sector[] = [
  {
    key: 'literary',
    title: 'Literário',
    image: '/images/sector-literary.jpg',
    alt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
  },
  {
    key: 'musical',
    title: 'Musical',
    image: '/images/sector-musical.jpg',
    alt: 'Wil Oliveira em cena no espetáculo Brasil Negreiro, tocando um instrumento de percussão.',
  },
  {
    key: 'artistic',
    title: 'Artístico criativo',
    image: '/images/sector-artistic.jpg',
    alt: 'Wil Oliveira de chapéu de palha com um tambor, diante de um painel grafitado e do estandarte do ateliê.',
  },
]
```

Em `frontend/src/components/home/WhatWeDo.tsx`, substituir a constante local `SECTORS` por:

```ts
import { SECTORS, type SectorKey } from '../../lib/sectors'

const SUMMARIES: Record<SectorKey, string> = {
  literary: 'Livros de temática negra, leituras, contação de histórias e teatro.',
  musical: 'Jongo, maculelê, maracatu, samba, rap, hip hop e funk.',
  artistic: 'Pintura, figurinos reciclados, desenho, escultura e colagem.',
}
```

e, no `map`, trocar `key={sector.title}` por `key={sector.key}` e `{sector.text}` por `{SUMMARIES[sector.key]}`.

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/navigation.test.ts src/tests/home.test.tsx src/tests/layout.test.tsx`
  Esperado: PASS (a home continua igual).
- [ ] **Passo 5: checkpoint** — relatório + perguntas de entendimento. Sem commit.

### Tarefa 2: Rota `/quem-somos` e o hero

**Arquivos:**
- Criar: `frontend/src/pages/About.tsx`, `frontend/src/components/about/AboutHero.tsx`
- Modificar: `frontend/src/routes.tsx` (filhos do `Layout`, antes do `*`)
- Teste: `frontend/src/tests/about.test.tsx` (novo)

**Interfaces:**
- Produz: `About()` (página), `AboutHero()`.

- [ ] **Passo 1: teste que falha** — `frontend/src/tests/about.test.tsx`

```tsx
import { screen } from '@testing-library/react'
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
})
```

- [ ] **Passo 2: rodar e ver falhar** — `npx vitest run src/tests/about.test.tsx`
  Esperado: FAIL (a rota cai no "Página não encontrada").

- [ ] **Passo 3: implementar** — `frontend/src/components/about/AboutHero.tsx`

```tsx
export function AboutHero() {
  return (
    <section className="desktop:mx-auto desktop:grid desktop:max-w-page desktop:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] desktop:items-center desktop:gap-12 desktop:px-8 desktop:pt-12">
      <img
        src="/images/hero-portrait.jpg"
        alt=""
        width={800}
        height={1000}
        className="block aspect-[4/5] w-full object-cover"
      />
      <div className="relative mx-4 -mt-24 border-[1.5px] border-brown bg-card px-5 py-5.5 shadow-applique-hero desktop:mx-0 desktop:mt-0">
        <p className="m-0 mb-2.5 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Quem somos</p>
        <h1 className="m-0 text-[1.875rem] leading-[1.12] font-bold text-pretty">
          Um espaço educativo de <em className="text-ochre-deep not-italic">reflexão, criação</em> e valorização da
          cultura e memória afro-brasileira
        </h1>
        <p className="m-0 mt-3 text-[0.9375rem] leading-normal text-brown-400">
          Casa Verde, zona norte de São Paulo · desde 2020
        </p>
      </div>
    </section>
  )
}
```

`frontend/src/pages/About.tsx`:

```tsx
import { AboutHero } from '../components/about/AboutHero'

export function About() {
  return <AboutHero />
}
```

Em `frontend/src/routes.tsx`, importar `About` e adicionar `{ path: '/quem-somos', element: <About /> }` nos filhos do
`Layout`, logo depois de `/agenda`.

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/about.test.tsx src/tests/routes.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 3: Índice de chips, Sankofa e Quem idealizou

**Arquivos:**
- Criar: `frontend/src/components/about/SectionIndex.tsx`, `SankofaSection.tsx`, `FoundersSection.tsx`
- Modificar: `frontend/src/pages/About.tsx`
- Teste: `frontend/src/tests/about.test.tsx`

**Interfaces:**
- Produz: `ABOUT_SECTIONS: readonly { id: string; label: string }[]` com os ids `sankofa`, `quem-idealizou`,
  `setores`, `onde-estamos`; `SectionIndex()`; `SankofaSection()`; `FoundersSection()`.

- [ ] **Passo 1: testes que falham** — acrescentar em `about.test.tsx`:

```tsx
  it('lists the four sections as anchors, Sankofa marked as the current one', () => {
    renderRoute('/quem-somos')

    const index = screen.getByRole('navigation', { name: 'Nesta página' })
    const links = within(index).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual(['#sankofa', '#quem-idealizou', '#setores', '#onde-estamos'])
    expect(within(index).getByRole('link', { name: 'Sankofa' })).toHaveAttribute('aria-current', 'location')
  })

  it('shows Sankofa and the founders with the placeholders of screen 5b', () => {
    renderRoute('/quem-somos')

    expect(screen.getByRole('heading', { name: 'Sankofa' }).closest('section')).toHaveAttribute('id', 'sankofa')
    expect(screen.getByText('"Nunca é tarde para voltar e apanhar aquilo que ficou para trás."')).toBeInTheDocument()
    expect(screen.getByText('Símbolo Sankofa', { exact: false })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Wil Oliveira e Nathália (Nathy) Monteiro' })).toBeInTheDocument()
    expect(screen.getByText('Foto de Wil e Nathy')).toBeInTheDocument()
    expect(screen.getByText('Janeiro de 2020')).toBeInTheDocument()
    for (const id of ['sankofa', 'quem-idealizou']) expect(document.getElementById(id)).toHaveClass('scroll-mt-32')
  })
```

(importar `within` de `@testing-library/react`).

- [ ] **Passo 2: rodar e ver falhar** — `npx vitest run src/tests/about.test.tsx`

- [ ] **Passo 3: implementar** — `SectionIndex.tsx` (versão estática; o destaque dinâmico entra na Tarefa 6):

```tsx
import { cn } from '../../lib/cn'

export const ABOUT_SECTIONS = [
  { id: 'sankofa', label: 'Sankofa' },
  { id: 'quem-idealizou', label: 'Quem idealizou' },
  { id: 'setores', label: 'Setores' },
  { id: 'onde-estamos', label: 'Onde estamos' },
] as const

export function SectionIndex() {
  const active = ABOUT_SECTIONS[0].id
  return (
    <nav aria-label="Nesta página" className="sticky top-15 z-20 flex gap-2 overflow-x-auto bg-cream px-4 pt-5 pb-3 desktop:justify-center">
      {ABOUT_SECTIONS.map((section) => {
        const current = section.id === active
        return (
          <a
            key={section.id}
            href={`#${section.id}`}
            aria-current={current ? 'location' : undefined}
            className={cn(
              'inline-flex min-h-11 flex-none items-center rounded-full border-[1.5px] border-brown px-3.5 text-small font-semibold no-underline',
              current ? 'bg-brown text-cream hover:text-cream' : 'bg-transparent text-brown hover:text-brown',
            )}
          >
            {section.label}
          </a>
        )
      })}
    </nav>
  )
}
```

`SankofaSection.tsx`:

```tsx
import { StripedBand } from '../ui'

export function SankofaSection() {
  return (
    <>
      <section id="sankofa" aria-labelledby="sankofa-title" className="mt-3 flex scroll-mt-32 flex-col gap-4 bg-brown px-5 pt-8 pb-7.5 text-cream">
        <div className="grid grid-cols-[6rem_minmax(0,1fr)] items-center gap-4">
          <div className="grid size-24 place-items-center border-[1.5px] border-dashed border-brown-300 p-1.5 text-center text-[0.6875rem] leading-[1.3] font-semibold text-cream-dim">
            Símbolo Sankofa
            <br />
            (arte da ONG)
          </div>
          <div>
            <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre">De onde vem o nome</p>
            <h2 id="sankofa-title" className="m-0 mt-1 text-[1.75rem] font-bold">
              Sankofa
            </h2>
          </div>
        </div>
        <p className="m-0 text-[1.375rem] leading-[1.4] text-pretty text-cream italic">
          "Nunca é tarde para voltar e apanhar aquilo que ficou para trás."
        </p>
        <p className="m-0 text-[0.96875rem] leading-[1.6] text-cream-dim">
          Sankofa é um símbolo africano representado por um pássaro que volta a cabeça à sua cauda, da filosofia do povo
          Akan, de Gana. É essa ideia que dá origem ao Ateliê Afro Cultural.
        </p>
      </section>
      <StripedBand />
    </>
  )
}
```

`FoundersSection.tsx`:

```tsx
const SKILLS = ['Contação de histórias', 'Dança', 'Música', 'Atuação', 'Escrita']

const MILESTONES = [
  { title: 'Janeiro de 2020', text: 'O ateliê ganha sede na Casa Verde.', marker: 'bg-ochre' },
  {
    title: 'Rede nacional',
    text: 'O casal participa do Caldeirão do Huck, na Rede Globo, na véspera do Dia Internacional Contra a Discriminação Racial.',
    marker: 'bg-brown',
  },
]

export function FoundersSection() {
  return (
    <section id="quem-idealizou" aria-labelledby="founders-title" className="flex scroll-mt-32 flex-col gap-4 px-4 pt-9">
      <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Quem idealizou</p>
      <div className="grid aspect-[4/3] place-items-center border-[1.5px] border-dashed border-brown-300 bg-cream-dark text-small font-semibold text-brown-400">
        Foto de Wil e Nathy
      </div>
      <h2 id="founders-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Wil Oliveira e Nathália (Nathy) Monteiro
      </h2>
      <p className="m-0 text-body leading-[1.6]">
        Um casal de artistas. Juntos somam pesquisa sobre a cultura afro-brasileira, contação de histórias, cultura popular
        brincante, dança, música, atuação e escrita.
      </p>
      <ul className="m-0 flex list-none flex-wrap gap-1.5 p-0">
        {SKILLS.map((skill) => (
          <li key={skill} className="border border-line bg-card px-2.5 py-1.5 text-[0.8125rem] font-semibold">
            {skill}
          </li>
        ))}
      </ul>
      <ol className="m-0 mt-2 flex list-none flex-col border-l-2 border-ochre p-0">
        {MILESTONES.map((milestone, index) => (
          <li key={milestone.title} className={index === MILESTONES.length - 1 ? 'relative pl-5' : 'relative pb-4.5 pl-5'}>
            <span aria-hidden="true" className={`absolute top-1 -left-1.75 size-3 ${milestone.marker}`} />
            <span className="block text-[0.9375rem] font-bold text-ochre-deep">{milestone.title}</span>
            <span className="text-[0.9375rem] leading-normal">{milestone.text}</span>
          </li>
        ))}
      </ol>
    </section>
  )
}
```

`About.tsx`:

```tsx
import { AboutHero } from '../components/about/AboutHero'
import { FoundersSection } from '../components/about/FoundersSection'
import { SankofaSection } from '../components/about/SankofaSection'
import { SectionIndex } from '../components/about/SectionIndex'

export function About() {
  return (
    <>
      <AboutHero />
      <SectionIndex />
      <div className="desktop:mx-auto desktop:max-w-[45rem]">
        <SankofaSection />
        <FoundersSection />
      </div>
    </>
  )
}
```

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/about.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 4: Setores e "Para quem"

**Arquivos:**
- Criar: `frontend/src/components/about/SectorsSection.tsx`, `AudienceStatement.tsx`
- Modificar: `frontend/src/pages/About.tsx`
- Teste: `frontend/src/tests/about.test.tsx`

**Interfaces:**
- Consome: `SECTORS`, `SectorKey` (Tarefa 1).
- Produz: `SectorsSection()`, `AudienceStatement()`.

- [ ] **Passo 1: teste que falha**

```tsx
  it('shows the three sectors with their photos and the audience statement', () => {
    renderRoute('/quem-somos')

    const sectors = document.getElementById('setores')!
    expect(within(sectors).getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual([
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
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — `SectorsSection.tsx`

```tsx
import { SECTORS, type SectorKey } from '../../lib/sectors'

const DETAILS: Record<SectorKey, { number: string; tone: string; text: string; tags?: string[] }> = {
  literary: {
    number: '01',
    tone: 'text-ochre-deep',
    text: 'Livros da temática negra: leituras, pesquisas, reflexões, contação de histórias e técnicas de teatro.',
  },
  musical: {
    number: '02',
    tone: 'text-blue-deep',
    text: 'Contato direto com a musicalidade afro-brasileira: cantigas, instrumentos e corporeidade negra, como os movimentos da capoeira.',
    tags: ['jongo', 'maculelê', 'maracatu', 'forró', 'samba', 'rap', 'hip hop', 'funk'],
  },
  artistic: {
    number: '03',
    tone: 'text-brown-400',
    text: 'Pintura em tela, materiais reciclados para figurinos e cenários, desenho, escultura e colagem.',
  },
}

export function SectorsSection() {
  return (
    <section id="setores" aria-labelledby="sectors-title" className="flex scroll-mt-32 flex-col gap-3.5 pt-10 desktop:mx-auto desktop:max-w-page desktop:px-8">
      <div className="px-4 desktop:px-0">
        <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">O que fazemos</p>
        <h2 id="sectors-title" className="m-0 mt-1 text-[1.625rem] font-bold">
          Nossos três setores
        </h2>
      </div>
      <ul className="m-0 flex list-none flex-col gap-3 px-4 desktop:grid desktop:grid-cols-3 desktop:gap-6 desktop:px-0">
        {SECTORS.map((sector) => {
          const detail = DETAILS[sector.key]
          return (
            <li key={sector.key} className="border border-line bg-card">
              <img src={sector.image} alt={sector.alt} width={1000} height={500} loading="lazy" className="block aspect-[2/1] w-full object-cover" />
              <div className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
                <span className={`text-[0.8125rem] font-bold ${detail.tone}`}>{detail.number}</span>
                <h3 className="m-0 text-[1.25rem] font-bold">{sector.title}</h3>
                <p className="m-0 text-[0.9375rem] leading-[1.55] text-brown-600">{detail.text}</p>
                {detail.tags && (
                  <ul className="m-0 mt-0.5 flex list-none flex-wrap gap-1.5 p-0">
                    {detail.tags.map((tag) => (
                      <li key={tag} className="bg-cream-dark px-2.25 py-1 text-[0.78125rem] font-semibold">
                        {tag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
```

`AudienceStatement.tsx`:

```tsx
export function AudienceStatement() {
  return (
    <section aria-labelledby="audience-title" className="mx-4 mt-10 flex flex-col gap-2 border-y-[1.5px] border-brown py-6 desktop:mx-0">
      <p id="audience-title" className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">
        Para quem
      </p>
      <p className="m-0 text-[1.5rem] leading-[1.3] font-bold text-pretty">
        Crianças, jovens e adultos, de todas as etnias, descendências e faixas etárias.
      </p>
    </section>
  )
}
```

`About.tsx` — depois do bloco da Tarefa 3, acrescentar `<SectorsSection />` e um novo
`<div className="desktop:mx-auto desktop:max-w-[45rem]"><AudienceStatement /></div>`.

- [ ] **Passo 4: rodar e ver passar.**
- [ ] **Passo 5: checkpoint.**

### Tarefa 5: Onde estamos (mapa) e CTA final

**Arquivos:**
- Criar: `frontend/src/components/about/LocationSection.tsx`, `AboutCallToAction.tsx`
- Modificar: `frontend/src/pages/About.tsx`
- Teste: `frontend/src/tests/about.test.tsx`

**Interfaces:**
- Consome: `CONTACTS.address` (`lib/contacts.ts`), `PROJECTS`, `VOLUNTEER`, `SUPPORT` (Tarefa 1).
- Produz: `LocationSection()`, `AboutCallToAction()`.

- [ ] **Passo 1: testes que falham**

```tsx
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

  it('gives every image a text alternative attribute', () => {
    renderRoute('/quem-somos')
    for (const image of screen.getByRole('main').querySelectorAll('img')) expect(image).toHaveAttribute('alt')
  })
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — `LocationSection.tsx`

```tsx
import { CONTACTS } from '../../lib/contacts'

const ADDRESS_LINE = 'Rua Dr. Paulo Gatti, 135 — Vila Romero'
const query = encodeURIComponent(CONTACTS.address)

export function LocationSection() {
  return (
    <section id="onde-estamos" aria-labelledby="location-title" className="flex scroll-mt-32 flex-col gap-3.5 px-4 pt-10 desktop:px-0">
      <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Onde estamos</p>
      <h2 id="location-title" className="m-0 text-[1.625rem] leading-[1.15] font-bold">
        Casa Verde, zona norte de São Paulo
      </h2>
      <p className="m-0 text-body leading-[1.6]">
        Um lugar de grande e importantíssima historicidade e presença negra. Daqui propomos atividades que aproximam as
        crianças da riqueza cultural afro-brasileira, para elevar o respeito e a autoestima de cada uma sobre si mesma e
        seu lugar no mundo.
      </p>
      <p className="m-0 border border-line bg-card px-4 py-3.5 text-[0.9375rem] leading-[1.55] text-brown-600">
        Sabemos que há necessidade de trabalhar e conscientizar o público infantil acerca das práticas e representações que
        configuram o racismo.
      </p>
      <iframe
        title={`Mapa: ${ADDRESS_LINE}`}
        src={`https://www.google.com/maps?q=${query}&output=embed`}
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        className="block aspect-[16/10] w-full border border-line bg-cream-dark"
      />
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2.5">
        <span className="text-[0.90625rem] leading-[1.45] text-brown-600">{ADDRESS_LINE}</span>
        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${query}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex min-h-11 items-center border-[1.5px] border-brown px-3.5 text-small font-semibold text-brown no-underline hover:text-brown"
        >
          Como chegar<span className="sr-only"> (abre o mapa em outra aba)</span>
        </a>
      </div>
    </section>
  )
}
```

`AboutCallToAction.tsx`:

```tsx
import { Link } from 'react-router-dom'
import { PROJECTS, SUPPORT, VOLUNTEER } from '../../lib/navigation'

const OUTLINE = 'flex min-h-12 items-center justify-center border-[1.5px] border-cream text-[0.9375rem] font-semibold text-cream no-underline hover:text-cream'

export function AboutCallToAction() {
  return (
    <section aria-labelledby="about-cta-title" className="mt-10 bg-brown px-5 py-7 text-cream">
      <div className="flex flex-col gap-3 desktop:mx-auto desktop:max-w-[45rem]">
        <h2 id="about-cta-title" className="m-0 text-[1.375rem] leading-[1.25] font-bold">
          Quer fazer parte desta história?
        </h2>
        <Link to={PROJECTS.to} className="flex min-h-13 items-center justify-center bg-ochre text-body font-semibold text-brown no-underline hover:text-brown">
          Conhecer nossos projetos
        </Link>
        <div className="grid grid-cols-2 gap-2">
          <Link to={VOLUNTEER.to} className={OUTLINE}>
            Ser voluntário
          </Link>
          <Link to={SUPPORT.to} className={OUTLINE}>
            Apoiar
          </Link>
        </div>
      </div>
    </section>
  )
}
```

`About.tsx` final:

```tsx
import { AboutCallToAction } from '../components/about/AboutCallToAction'
import { AboutHero } from '../components/about/AboutHero'
import { AudienceStatement } from '../components/about/AudienceStatement'
import { FoundersSection } from '../components/about/FoundersSection'
import { LocationSection } from '../components/about/LocationSection'
import { SankofaSection } from '../components/about/SankofaSection'
import { SectionIndex } from '../components/about/SectionIndex'
import { SectorsSection } from '../components/about/SectorsSection'

const READING_COLUMN = 'desktop:mx-auto desktop:max-w-[45rem]'

export function About() {
  return (
    <>
      <AboutHero />
      <SectionIndex />
      <div className={READING_COLUMN}>
        <SankofaSection />
        <FoundersSection />
      </div>
      <SectorsSection />
      <div className={READING_COLUMN}>
        <AudienceStatement />
        <LocationSection />
      </div>
      <AboutCallToAction />
    </>
  )
}
```

- [ ] **Passo 4: rodar e ver passar.**
- [ ] **Passo 5: checkpoint.**

### Tarefa 6: Destaque do chip da seção visível

**Arquivos:**
- Criar: `frontend/src/components/about/useActiveSection.ts`
- Modificar: `frontend/src/components/about/SectionIndex.tsx`
- Teste: `frontend/src/tests/about.test.tsx`

**Interfaces:**
- Consome: `ABOUT_SECTIONS` (Tarefa 3).
- Produz: `useActiveSection(ids: readonly string[]): string`.

- [ ] **Passo 1: teste que falha** (o `IntersectionObserver` é simulado só neste teste, sem tocar no `setup.ts`):

```tsx
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
```

(importar `act` de `@testing-library/react`).

- [ ] **Passo 2: rodar e ver falhar** — esperado: "Sankofa" continua marcado.

- [ ] **Passo 3: implementar** — `useActiveSection.ts`

```ts
import { useEffect, useState } from 'react'

export function useActiveSection(ids: readonly string[]): string {
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
        if (visible[0]) setActive(visible[0].target.id)
      },
      // A section counts as current while it crosses the middle band of the screen, below the sticky header and chips.
      { rootMargin: '-40% 0px -55% 0px' },
    )
    for (const id of ids) {
      const element = document.getElementById(id)
      if (element) observer.observe(element)
    }
    return () => observer.disconnect()
  }, [ids])

  return active
}
```

Em `SectionIndex.tsx`, criar no topo do módulo `const SECTION_IDS = ABOUT_SECTIONS.map((section) => section.id)` (referência
estável para o efeito) e trocar `const active = ABOUT_SECTIONS[0].id` por `const active = useActiveSection(SECTION_IDS)`.

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/about.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 7: Verificação, documentação e revisão do PR 1

**Arquivos:**
- Modificar: `docs/04_Gerencia_de_Mudancas/Changelog.md`, `CLAUDE.md` (tabela de status), `AGENTS.md` (log de IA)

- [ ] **Passo 1: verificação automática** — em `frontend/`: `npm test`, `npm run typecheck`, `npm run lint`.
  Esperado: tudo verde.
- [ ] **Passo 2: verificação visual** — `npm run dev` e abrir `/quem-somos` no Chromium a 390px, 320px (A+ e alto
  contraste) e 1440px, lado a lado com a tela 5b. Conferir: ordem dos blocos, aplique só no card do hero, faixa
  depois do Sankofa, chips fixos sob o cabeçalho, âncoras não escondidas pelo cabeçalho (Foco de revisão 5), sem
  rolagem horizontal, alvos ≥ 44px, foco visível no teclado.
- [ ] **Passo 3: Changelog** — nova entrada no fim de `Changelog.md`, no modelo do arquivo:

```markdown
## 2026-10-09 — Página "Quem somos" (RF02, tela 5b)

**Artefato:** interface (`/quem-somos`).
**Antes:** o link "Quem somos" do menu e da home levava ao 404.
**Depois:** página fiel à tela 5b do Claude Design: hero com a frase-missão, índice fixo com destaque da seção visível,
Sankofa, idealizadores com linha do tempo, os três setores, "Para quem", mapa com "Como chegar" e chamada final.
**Por quê:** paridade com a V1. Por decisão do Yuri, a página segue o design também no texto e nos espaços de imagem.
**Diferenças registradas:** texto resumido do 5b no lugar do texto literal da V1 (o RF02 pede "palavra por palavra" —
a ONG precisa aprovar); placeholders "Símbolo Sankofa (arte da ONG)" e "Foto de Wil e Nathy" até a ONG enviar o
material; sobretítulo "Quem somos" e faixa listrada dentro da página, contrariando duas regras de layout do `CLAUDE.md`.
**Confirmar com a ONG:** texto resumido, arte do Sankofa, foto do casal.
**PR:** `feat/about-page`
```

- [ ] **Passo 4: CLAUDE.md** — na tabela de status, nova linha: `| Quem somos (RF02, tela 5b) | **pronta**: /quem-somos
  fiel ao 5b (…resumo do que foi conferido no Chromium…). **Falta:** arte do Sankofa e foto do casal (ONG); aprovação
  do texto resumido |`.
- [ ] **Passo 5: AGENTS.md** — nova linha na tabela do log de IA (§1): `| 2026-10-09 | Claude Code (Opus) + Superpowers
  | brainstorming, spec, plano e implementação assistida da página Quem somos | feat/about-page | Yuri Oliveira |`.
- [ ] **Passo 6: revisão antes do commit** — resumo do diff (`git diff --stat` e trechos), pontos de atenção para o
  Yuri revisar, e **pedir autorização** para: (a) commitar com
  `feat(frontend): RF02 about page following screen 5b` (código) e `docs: record the about page in the changelog,
  guide and AI log` (docs); (b) depois, push e PR. Nada acontece sem o "sim".

---

# PR 2 — Projetos (`feat/projects-page`)

### Tarefa 8: Tabela `projects` com os 11 projetos

**Arquivos:**
- Criar: `backend/src/database/data/projects.json` (gerado no Passo 1)
- Criar: `backend/src/database/migrations/20261010120000-create-projects.ts` (se já houver migration com data maior na
  `main`, usar um timestamp posterior a ela)
- Criar: `backend/src/models/project.model.ts`
- Modificar: `backend/src/models/index.ts`
- Teste: `backend/tests/integration/projects.integration.test.ts` (novo)

**Interfaces:**
- Produz: `Project` (modelo Sequelize) com `id, slug, title, summary, description, genre, duration, ageRating, venue,
  castMembers, requirements, category, coverUrl, coverAlt, published, createdAt, updatedAt`;
  `ProjectCategory = 'storytelling' | 'experience' | 'play'`.

- [ ] **Passo 0:** `git switch main && git pull --ff-only && git switch -c feat/projects-page` (depois do PR 1
  mergeado; se ainda não estiver, partir da `main` mesmo assim — os PRs são independentes).

- [ ] **Passo 1: gerar o arquivo de dados** a partir da V1 (rodar uma vez, da pasta `backend/`; o script fica fora do
  repo, no terminal):

```bash
node -e '
const fs = require("fs");
const src = JSON.parse(fs.readFileSync("../../venturus-atelie-v1/dados-iniciais/atividades.json", "utf8"));
const list = Array.isArray(src) ? src : src.atividades;
const category = { "banzo": "storytelling", "catirina-e-nego-dito": "storytelling", "cafu-e-o-cafe": "storytelling",
  "a-cabaca-e-o-canto-ancestral": "storytelling", "eu-griot": "storytelling", "memoria-negra": "storytelling",
  "brincadeiras-encantadas-na-mata": "experience", "projeto-brincantes": "experience", "batuque-na-cozinha": "experience",
  "brasil-negreiro": "play" };
const design = {
  "cafu-e-o-cafe": { genre: "Contação de história" },
  "banzo": { genre: "Contação performática", summary: "Sobre a saudade da pátria e da liberdade sentida pelos africanos escravizados." },
  "catirina-e-nego-dito": { genre: "Fantoches", summary: "Fantoches e música ao vivo, a partir da história do auto do boi." },
  "brincadeiras-encantadas-na-mata": { genre: "História-brincante", summary: "Uma aventura de faz de conta pela mata, para crianças e adultos." },
};
const cover = {
  "cafu-e-o-cafe": ["/images/sector-literary.jpg", "Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria."],
  "brasil-negreiro": ["/images/sector-musical.jpg", "Wil Oliveira em cena no espetáculo Brasil Negreiro, tocando um instrumento de percussão."],
};
const short = (value, from, to) => (value === from ? to : value ?? null);
const rows = list.map((p) => ({
  slug: p.id, title: p.titulo, summary: p.resumo ?? null, description: p.descricao ?? null, genre: p.genero ?? null,
  duration: short(p.duracao, "50 minutos", "50 min"), ageRating: p.classificacao ?? null,
  venue: short(p.local, "Adaptável a qualquer espaço", "Qualquer"), castMembers: p.elenco ?? null,
  requirements: p.rider ?? null, category: category[p.id] ?? null,
  coverUrl: cover[p.id]?.[0] ?? null, coverAlt: cover[p.id]?.[1] ?? null, ...design[p.id] }));
fs.mkdirSync("src/database/data", { recursive: true });
fs.writeFileSync("src/database/data/projects.json", JSON.stringify(rows, null, 2) + "\n");
console.log(rows.length, "projects");
'
```

Esperado: `11 projects`. Conferir no arquivo: Banzo com `genre` "Contação performática"; Brincadeiras com `duration`
"A combinar"; Ateliê Itinerante com `category` `null`; capas só em Cafú e Brasil Negreiro.

- [ ] **Passo 2: teste de integração que falha** — `backend/tests/integration/projects.integration.test.ts`

```ts
import { migrator } from '../../src/database/migrate';
import { Project, sequelize } from '../../src/models';

let seeded: Project[] = [];

beforeAll(async () => {
  await migrator.up();
  seeded = await Project.findAll({ order: [['title', 'ASC']] });
});

afterAll(async () => {
  await sequelize.close();
});

describe('projects table', () => {
  it('is loaded with the 11 real projects, all published', () => {
    expect(seeded).toHaveLength(11);
    expect(seeded.every((project) => project.published)).toBe(true);
    expect(seeded.map((project) => project.slug)).toContain('banzo');
  });

  it('classifies them as decided with the team', () => {
    const bySlug = Object.fromEntries(seeded.map((project) => [project.slug, project.category]));
    expect(bySlug['brasil-negreiro']).toBe('play');
    expect(bySlug['batuque-na-cozinha']).toBe('experience');
    expect(bySlug['eu-griot']).toBe('storytelling');
    expect(bySlug['atelie-itinerante']).toBeNull();
  });

  it('refuses a cover without a description and an unknown category', async () => {
    await expect(Project.create({ slug: 'teste-capa', title: 'Teste', coverUrl: '/images/x.jpg', coverAlt: null })).rejects.toThrow();
    await expect(Project.create({ slug: 'teste-categoria', title: 'Teste', category: 'show' as never })).rejects.toThrow();
  });

  it('refuses two projects with the same slug', async () => {
    await expect(Project.create({ slug: 'banzo', title: 'Outro Banzo' })).rejects.toThrow();
  });
});
```

- [ ] **Passo 3: rodar e ver falhar** — `cd backend && npm run test:db -- projects`
  Esperado: FAIL (`Project` não existe). Pré-requisito: MySQL do `docker compose up db` e o banco `atelie_test`
  criado como no `backend/README.md`.

- [ ] **Passo 4: implementar** — migration `20261010120000-create-projects.ts`

```ts
import { randomUUID } from 'node:crypto';
import { DataTypes } from 'sequelize';
import projects from '../data/projects.json';
import type { Migration } from '../migrate';

const text = (length: number) => ({ type: DataTypes.STRING(length), allowNull: true });

export const up: Migration = async ({ context: queryInterface }) => {
  await queryInterface.createTable('projects', {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    summary: text(400),
    description: { type: DataTypes.TEXT, allowNull: true },
    genre: text(200),
    duration: text(200),
    age_rating: text(200),
    venue: text(200),
    cast_members: text(200),
    requirements: text(200),
    category: text(20),
    cover_url: text(255),
    cover_alt: text(255),
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    created_at: { type: DataTypes.DATE, allowNull: false },
    updated_at: { type: DataTypes.DATE, allowNull: false },
  });

  await queryInterface.addIndex('projects', ['published', 'title'], { name: 'projects_published_title_idx' });
  await queryInterface.sequelize.query(
    "ALTER TABLE projects ADD CONSTRAINT projects_category_known CHECK (category IS NULL OR category IN ('storytelling','experience','play'))",
  );
  await queryInterface.sequelize.query(
    "ALTER TABLE projects ADD CONSTRAINT projects_cover_has_alt CHECK (cover_url IS NULL OR (cover_alt IS NOT NULL AND cover_alt <> ''))",
  );

  const now = new Date();
  await queryInterface.bulkInsert(
    'projects',
    projects.map((project) => ({
      id: randomUUID(),
      slug: project.slug,
      title: project.title,
      summary: project.summary,
      description: project.description,
      genre: project.genre,
      duration: project.duration,
      age_rating: project.ageRating,
      venue: project.venue,
      cast_members: project.castMembers,
      requirements: project.requirements,
      category: project.category,
      cover_url: project.coverUrl,
      cover_alt: project.coverAlt,
      published: true,
      created_at: now,
      updated_at: now,
    })),
  );
};

export const down: Migration = async ({ context: queryInterface }) => {
  await queryInterface.dropTable('projects');
};
```

`backend/src/models/project.model.ts`:

```ts
import { DataTypes, Model, type CreationOptional, type InferAttributes, type InferCreationAttributes } from 'sequelize';
import { sequelize } from '../config/database';

export type ProjectCategory = 'storytelling' | 'experience' | 'play';

export class Project extends Model<InferAttributes<Project>, InferCreationAttributes<Project>> {
  declare id: CreationOptional<string>;
  declare slug: string;
  declare title: string;
  declare summary: CreationOptional<string | null>;
  declare description: CreationOptional<string | null>;
  declare genre: CreationOptional<string | null>;
  declare duration: CreationOptional<string | null>;
  declare ageRating: CreationOptional<string | null>;
  declare venue: CreationOptional<string | null>;
  declare castMembers: CreationOptional<string | null>;
  declare requirements: CreationOptional<string | null>;
  declare category: CreationOptional<ProjectCategory | null>;
  declare coverUrl: CreationOptional<string | null>;
  declare coverAlt: CreationOptional<string | null>;
  declare published: CreationOptional<boolean>;
  declare createdAt: CreationOptional<Date>;
  declare updatedAt: CreationOptional<Date>;
}

const text = (length: number) => ({ type: DataTypes.STRING(length), allowNull: true });

Project.init(
  {
    id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
    slug: { type: DataTypes.STRING(80), allowNull: false, unique: true },
    title: { type: DataTypes.STRING(160), allowNull: false },
    summary: text(400),
    description: { type: DataTypes.TEXT, allowNull: true },
    genre: text(200),
    duration: text(200),
    ageRating: text(200),
    venue: text(200),
    castMembers: text(200),
    requirements: text(200),
    category: text(20),
    coverUrl: text(255),
    coverAlt: text(255),
    published: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    createdAt: DataTypes.DATE,
    updatedAt: DataTypes.DATE,
  },
  { sequelize, tableName: 'projects' },
);
```

Em `backend/src/models/index.ts`, acrescentar `export { Project, type ProjectCategory } from './project.model';`.

- [ ] **Passo 5: rodar e ver passar** — `npm run test:db -- projects` e `npm run typecheck`.
- [ ] **Passo 6: checkpoint.**

### Tarefa 9: `GET /api/projects`

**Arquivos:**
- Criar: `backend/src/services/projects.service.ts`, `backend/src/controllers/projects.controller.ts`,
  `backend/src/routes/projects.routes.ts`
- Modificar: `backend/src/routes/index.ts`, `backend/src/docs/openapi.ts`, `backend/README.md` (tabela de rotas)
- Teste: `backend/tests/projects.test.ts` (novo); acrescentar caso em `projects.integration.test.ts`

**Interfaces:**
- Consome: `Project`, `ProjectCategory` (Tarefa 8).
- Produz: `ProjectSummary`, `ProjectDetail`, `listPublishedProjects(): Promise<ProjectSummary[]>`,
  `getPublishedProject(slug: string): Promise<ProjectDetail | null>`; resposta `{ data: ProjectSummary[] }`.

- [ ] **Passo 1: teste unitário que falha** — `backend/tests/projects.test.ts`

```ts
import request from 'supertest';
import { createApp } from '../src/app';
import { Project } from '../src/models';

const app = createApp();

function fakeProject(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: '5b1d2c4e-0f3a-4c2b-9a1d-1c2b3a4d5e6f',
    slug: 'cafu-e-o-cafe',
    title: 'Cafú e o Café',
    summary: 'Contação de história que leva o público às fazendas de café do Vale do Paraíba do século XIX.',
    description: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
    genre: 'Contação de história',
    duration: '50 min',
    ageRating: 'Livre',
    venue: 'Qualquer',
    castMembers: 'Wil Oliveira',
    requirements: '1 caixa de som · 1 microfone headset',
    category: 'storytelling',
    coverUrl: '/images/sector-literary.jpg',
    coverAlt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
    published: true,
    ...overrides,
  } as unknown as Project;
}

afterEach(() => jest.restoreAllMocks());

describe('GET /api/projects', () => {
  it('lists only published projects, in alphabetical order, with the list fields', async () => {
    const findAll = jest.spyOn(Project, 'findAll').mockResolvedValue([fakeProject()]);

    const response = await request(app).get('/api/projects');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      data: [
        {
          slug: 'cafu-e-o-cafe',
          title: 'Cafú e o Café',
          summary: 'Contação de história que leva o público às fazendas de café do Vale do Paraíba do século XIX.',
          genre: 'Contação de história',
          duration: '50 min',
          category: 'storytelling',
          coverUrl: '/images/sector-literary.jpg',
          coverAlt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
        },
      ],
    });
    const options = findAll.mock.calls[0]![0]!;
    expect(options.where).toEqual({ published: true });
    expect(options.order).toEqual([['title', 'ASC']]);
  });
});
```

- [ ] **Passo 2: rodar e ver falhar** — `npx jest tests/projects.test.ts` → 404.

- [ ] **Passo 3: implementar** — `backend/src/services/projects.service.ts`

```ts
import { Project, type ProjectCategory } from '../models';

export interface ProjectSummary {
  slug: string;
  title: string;
  summary: string | null;
  genre: string | null;
  duration: string | null;
  category: ProjectCategory | null;
  coverUrl: string | null;
  coverAlt: string | null;
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null;
  ageRating: string | null;
  venue: string | null;
  castMembers: string | null;
  requirements: string | null;
}

export function toProjectSummary(project: Project): ProjectSummary {
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    genre: project.genre,
    duration: project.duration,
    category: project.category,
    coverUrl: project.coverUrl,
    coverAlt: project.coverAlt,
  };
}

export function toProjectDetail(project: Project): ProjectDetail {
  return {
    ...toProjectSummary(project),
    description: project.description,
    ageRating: project.ageRating,
    venue: project.venue,
    castMembers: project.castMembers,
    requirements: project.requirements,
  };
}

export async function listPublishedProjects(): Promise<ProjectSummary[]> {
  const projects = await Project.findAll({ where: { published: true }, order: [['title', 'ASC']] });
  return projects.map(toProjectSummary);
}

export async function getPublishedProject(slug: string): Promise<ProjectDetail | null> {
  const project = await Project.findOne({ where: { slug, published: true } });
  return project ? toProjectDetail(project) : null;
}
```

`backend/src/controllers/projects.controller.ts` (a parte do detalhe já fica pronta para a Tarefa 13):

```ts
import type { Request, Response } from 'express';
import { z } from 'zod';
import { getPublishedProject, listPublishedProjects } from '../services/projects.service';
import { ApiError } from '../utils/api-error';

export const projectParams = z.object({
  slug: z.string().max(80, 'Endereço inválido.').regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Endereço inválido.'),
});

export async function listProjects(_req: Request, res: Response): Promise<void> {
  res.json({ data: await listPublishedProjects() });
}

export async function getProject(req: Request, res: Response): Promise<void> {
  const project = await getPublishedProject(req.params.slug as string);
  if (!project) throw new ApiError(404, 'project_not_found', 'Não encontramos esse projeto.');
  res.json({ project });
}
```

`backend/src/routes/projects.routes.ts` (só a lista nesta tarefa):

```ts
import { Router } from 'express';
import { listProjects } from '../controllers/projects.controller';

export const projectsRoutes = Router();

projectsRoutes.get('/', listProjects);
```

Em `backend/src/routes/index.ts`: `import { projectsRoutes } from './projects.routes';` e
`routes.use('/projects', projectsRoutes);` depois de `/events`.

Em `backend/src/docs/openapi.ts`, em `components.schemas`:

```ts
      ProjectSummary: {
        type: 'object',
        required: ['slug', 'title', 'summary', 'genre', 'duration', 'category', 'coverUrl', 'coverAlt'],
        properties: {
          slug: { type: 'string', example: 'banzo' },
          title: { type: 'string', example: 'Banzo' },
          summary: { type: ['string', 'null'] },
          genre: { type: ['string', 'null'], example: 'Contação performática' },
          duration: { type: ['string', 'null'], example: '50 min' },
          category: { type: ['string', 'null'], enum: ['storytelling', 'experience', 'play', null] },
          coverUrl: { type: ['string', 'null'] },
          coverAlt: { type: ['string', 'null'], description: 'Sempre preenchido quando há capa.' },
        },
      },
```

e em `paths`, depois de `'/events/{id}'`:

```ts
    '/projects': {
      get: {
        tags: ['Projects'],
        summary: 'Projetos publicados, em ordem alfabética',
        responses: {
          '200': {
            description: 'A lista',
            content: { 'application/json': { schema: { type: 'object', properties: { data: { type: 'array', items: { $ref: '#/components/schemas/ProjectSummary' } } } } } },
          },
        },
      },
    },
```

No `backend/README.md`, tabela de rotas: `| GET | /api/projects | público | projetos publicados, em ordem alfabética |`.

Acrescentar em `projects.integration.test.ts`:

```ts
  it('lists through the service in alphabetical order, skipping unpublished ones', async () => {
    const hidden = await Project.create({ slug: 'aaa-fora-do-ar', title: 'AAA fora do ar', published: false });
    const list = await listPublishedProjects();
    expect(list.map((project) => project.slug)).not.toContain('aaa-fora-do-ar');
    expect(list[0]!.title).toBe('A Cabaça e o Canto Ancestral');
    await hidden.destroy();
  });
```

(importar `listPublishedProjects` de `../../src/services/projects.service`).

- [ ] **Passo 4: rodar e ver passar** — `npm test`, `npm run test:db -- projects`, `npm run typecheck`.
- [ ] **Passo 5: checkpoint.**

### Tarefa 10: Página `/projetos` — lista

**Arquivos:**
- Criar: `frontend/src/types/project.ts`, `frontend/src/services/projects.ts`, `frontend/src/lib/projects.ts`,
  `frontend/src/components/projects/ProjectCard.tsx`, `ProjectRow.tsx`, `ProjectList.tsx`, `frontend/src/pages/Projects.tsx`
- Modificar: `frontend/src/routes.tsx`
- Teste: `frontend/src/tests/projects.test.tsx` (novo)

**Interfaces:**
- Consome: `GET /api/projects` → `{ data: ProjectSummary[] }` (Tarefa 9).
- Produz: tipos `ProjectCategory`, `ProjectSummary`, `ProjectDetail`; `useProjects()`, `useProject(slug)`;
  `projectMeta(project: ProjectSummary): string`; `ProjectList({ projects })`.

- [ ] **Passo 1: testes que falham** — `frontend/src/tests/projects.test.tsx`

```tsx
import { screen, waitFor, within } from '@testing-library/react'
import { api } from '../services/api'
import type { ProjectSummary } from '../types/project'
import { renderRoute } from './render'

export function project(overrides: Partial<ProjectSummary> = {}): ProjectSummary {
  return {
    slug: 'banzo',
    title: 'Banzo',
    summary: 'Sobre a saudade da pátria e da liberdade sentida pelos africanos escravizados.',
    genre: 'Contação performática',
    duration: '50 min',
    category: 'storytelling',
    coverUrl: null,
    coverAlt: null,
    ...overrides,
  }
}

const PROJECTS = [
  project({ slug: 'brasil-negreiro', title: 'Brasil Negreiro: Imaginário em Liberdade', genre: 'Peça / contação', duration: null, summary: null, category: 'play', coverUrl: '/images/sector-musical.jpg', coverAlt: 'Wil Oliveira em cena no espetáculo Brasil Negreiro.' }),
  project(),
  project({ slug: 'batuque-na-cozinha', title: 'Batuque na Cozinha', genre: 'Contação / vivência', duration: null, summary: null, category: 'experience' }),
  project({ slug: 'atelie-afro-cultural-itinerante', title: 'Ateliê Afro Cultural Itinerante', genre: null, duration: null, category: null }),
]

async function openProjects(projects: ProjectSummary[] = PROJECTS) {
  vi.mocked(api.get).mockResolvedValue({ data: { data: projects } })
  renderRoute('/projetos')
  await waitFor(() => expect(screen.queryByText('Carregando os projetos…')).not.toBeInTheDocument())
}

describe('Projects page', () => {
  it('shows the header of screen 3b', async () => {
    await openProjects()
    expect(screen.getByRole('heading', { level: 1, name: 'Projetos e atividades' })).toBeInTheDocument()
    expect(screen.getByText('Contações de história performáticas e vivências brincantes. Todas se adaptam a qualquer espaço e têm classificação livre.')).toBeInTheDocument()
  })

  it('links every project to its page, as a card when it has a cover and a row when it does not', async () => {
    await openProjects()
    const list = screen.getByRole('list', { name: 'Projetos' })
    const links = within(list).getAllByRole('link')
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/projetos/brasil-negreiro',
      '/projetos/banzo',
      '/projetos/batuque-na-cozinha',
      '/projetos/atelie-afro-cultural-itinerante',
    ])
    expect(within(links[0]!).getByRole('img', { name: 'Wil Oliveira em cena no espetáculo Brasil Negreiro.' })).toBeInTheDocument()
    expect(within(links[1]!).queryByRole('img')).not.toBeInTheDocument()
    expect(within(links[1]!).getByText('Contação performática · 50 min')).toBeInTheDocument()
  })

  it('does not print an empty label for a project without genre and duration', async () => {
    await openProjects()
    const row = screen.getByRole('link', { name: /Ateliê Afro Cultural Itinerante/ })
    expect(row.querySelector('[data-meta]')).toBeNull()
  })
})
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — `frontend/src/types/project.ts`

```ts
export type ProjectCategory = 'storytelling' | 'experience' | 'play'

export interface ProjectSummary {
  slug: string
  title: string
  summary: string | null
  genre: string | null
  duration: string | null
  category: ProjectCategory | null
  coverUrl: string | null
  coverAlt: string | null
}

export interface ProjectDetail extends ProjectSummary {
  description: string | null
  ageRating: string | null
  venue: string | null
  castMembers: string | null
  requirements: string | null
}
```

`frontend/src/services/projects.ts`

```ts
import { useQuery } from '@tanstack/react-query'
import type { ProjectDetail, ProjectSummary } from '../types/project'
import { api } from './api'

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => (await api.get<{ data: ProjectSummary[] }>('/projects')).data.data,
  })
}

export function useProject(slug: string | undefined) {
  return useQuery({
    queryKey: ['projects', 'detail', slug],
    queryFn: async () => (await api.get<{ project: ProjectDetail }>(`/projects/${slug}`)).data.project,
    enabled: Boolean(slug),
    retry: false,
  })
}
```

`frontend/src/lib/projects.ts` (a parte das categorias entra na Tarefa 11):

```ts
import type { ProjectSummary } from '../types/project'

export const projectMeta = (project: Pick<ProjectSummary, 'genre' | 'duration'>): string =>
  [project.genre, project.duration].filter(Boolean).join(' · ')
```

`frontend/src/components/projects/ProjectCard.tsx`

```tsx
import { Link } from 'react-router-dom'
import { projectMeta } from '../../lib/projects'
import type { ProjectSummary } from '../../types/project'

export function ProjectCard({ project }: { project: ProjectSummary }) {
  const meta = projectMeta(project)
  return (
    <Link to={`/projetos/${project.slug}`} className="block border border-line bg-card text-brown no-underline hover:text-brown">
      <img src={project.coverUrl ?? ''} alt={project.coverAlt ?? ''} width={1000} height={563} loading="lazy" className="block aspect-video w-full object-cover" />
      <span className="flex flex-col gap-1.5 px-4 pt-3.5 pb-4">
        {meta && (
          <span data-meta className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">
            {meta}
          </span>
        )}
        <span className="text-[1.25rem] leading-[1.2] font-bold">{project.title}</span>
        {project.summary && <span className="text-[0.9375rem] leading-normal text-brown-600">{project.summary}</span>}
      </span>
    </Link>
  )
}
```

`frontend/src/components/projects/ProjectRow.tsx`

```tsx
import { Link } from 'react-router-dom'
import { projectMeta } from '../../lib/projects'
import type { ProjectSummary } from '../../types/project'
import { Chevron } from '../ui'

export function ProjectRow({ project }: { project: ProjectSummary }) {
  const meta = projectMeta(project)
  return (
    <Link
      to={`/projetos/${project.slug}`}
      className="grid grid-cols-[minmax(0,1fr)_0.875rem] items-center gap-3 border border-line bg-card px-4 py-3.5 text-brown no-underline hover:text-brown"
    >
      <span className="flex flex-col gap-1">
        {meta && (
          <span data-meta className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-blue-deep">
            {meta}
          </span>
        )}
        <span className="text-h3 font-bold">{project.title}</span>
        {project.summary && <span className="text-small text-brown-400">{project.summary}</span>}
      </span>
      <Chevron />
    </Link>
  )
}
```

`frontend/src/components/projects/ProjectList.tsx`

```tsx
import type { ProjectSummary } from '../../types/project'
import { ProjectCard } from './ProjectCard'
import { ProjectRow } from './ProjectRow'

export function ProjectList({ projects }: { projects: ProjectSummary[] }) {
  return (
    <ul aria-label="Projetos" className="m-0 flex list-none flex-col gap-3 p-0">
      {projects.map((project) => (
        <li key={project.slug}>{project.coverUrl ? <ProjectCard project={project} /> : <ProjectRow project={project} />}</li>
      ))}
    </ul>
  )
}
```

`frontend/src/pages/Projects.tsx` (primeira versão; estados, filtro e CTA entram na Tarefa 11):

```tsx
import { ProjectList } from '../components/projects/ProjectList'
import { Container, PageHeader } from '../components/ui'
import { useProjects } from '../services/projects'

export function Projects() {
  const { data: projects, isPending } = useProjects()

  return (
    <Container className="pb-8">
      <PageHeader
        overline="Conhecer"
        title="Projetos e atividades"
        lead="Contações de história performáticas e vivências brincantes. Todas se adaptam a qualquer espaço e têm classificação livre."
      />
      {isPending && <p role="status" className="m-0 text-brown-400">Carregando os projetos…</p>}
      {projects && <ProjectList projects={projects} />}
    </Container>
  )
}
```

Em `routes.tsx`: `{ path: '/projetos', element: <Projects /> }` nos filhos do `Layout`, depois de `/quem-somos`.

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/projects.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 11: Filtro por categoria, estados, CTA e desktop

**Arquivos:**
- Modificar: `frontend/src/lib/projects.ts`, `frontend/src/pages/Projects.tsx`
- Criar: `frontend/src/components/projects/SchoolsCallToAction.tsx`
- Teste: `frontend/src/tests/projects.test.tsx`

**Interfaces:**
- Consome: `ChipFilter`, `ChipOption` (`components/ui`), `SCHOOLS` (Tarefa 1).
- Produz: `ALL_PROJECTS = 'all'`, `projectCategoryOptions(projects): ChipOption[]`,
  `filterProjects(projects, value): ProjectSummary[]`, `SchoolsCallToAction()`.

- [ ] **Passo 1: testes que falham** — acrescentar:

```tsx
import userEvent from '@testing-library/user-event'

  it('filters by category with the chips of screen 3b', async () => {
    await openProjects()
    const chips = screen.getByRole('group', { name: 'Tipo de projeto' })
    expect(within(chips).getAllByRole('button').map((chip) => chip.textContent)).toEqual(['Todas · 4', 'Contação', 'Vivência', 'Peça'])

    await userEvent.click(within(chips).getByRole('button', { name: 'Vivência' }))

    const list = screen.getByRole('list', { name: 'Projetos' })
    expect(within(list).getAllByRole('link').map((link) => link.getAttribute('href'))).toEqual(['/projetos/batuque-na-cozinha'])
    expect(within(chips).getByRole('button', { name: 'Vivência' })).toHaveAttribute('aria-pressed', 'true')
  })

  it('explains an empty category instead of showing an empty list', async () => {
    await openProjects([project()])
    await userEvent.click(screen.getByRole('button', { name: 'Peça' }))
    expect(screen.getByText('Nenhum projeto nesta categoria por enquanto')).toBeInTheDocument()
  })

  it('offers a retry when the list fails to load', async () => {
    vi.mocked(api.get).mockRejectedValue(new Error('offline'))
    renderRoute('/projetos')
    expect(await screen.findByText('Não conseguimos carregar os projetos agora')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument()
  })

  it('ends with the schools call to action', async () => {
    await openProjects()
    expect(screen.getByText('Quer levar uma destas para a sua escola?')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Veja como funciona' })).toHaveAttribute('href', '/para-escolas')
  })
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — acrescentar em `frontend/src/lib/projects.ts`:

```ts
import type { ChipOption } from '../components/ui/ChipFilter'
import type { ProjectCategory, ProjectSummary } from '../types/project'

export const ALL_PROJECTS = 'all'

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
  storytelling: 'Contação',
  experience: 'Vivência',
  play: 'Peça',
}

export function projectCategoryOptions(projects: ProjectSummary[]): ChipOption[] {
  return [
    { value: ALL_PROJECTS, label: 'Todas ·', count: projects.length },
    ...(Object.keys(CATEGORY_LABELS) as ProjectCategory[]).map((category) => ({ value: category, label: CATEGORY_LABELS[category] })),
  ]
}

export const filterProjects = (projects: ProjectSummary[], value: string): ProjectSummary[] =>
  value === ALL_PROJECTS ? projects : projects.filter((project) => project.category === value)
```

(o `import type { ProjectSummary }` já existente passa a vir dessa linha única).

`frontend/src/components/projects/SchoolsCallToAction.tsx`

```tsx
import { SCHOOLS } from '../../lib/navigation'
import { Button } from '../ui'

export function SchoolsCallToAction() {
  return (
    <section aria-label="Para escolas" className="mt-2 bg-brown p-5 text-cream">
      <p className="m-0 text-h3 leading-[1.3] font-bold">Quer levar uma destas para a sua escola?</p>
      <Button to={SCHOOLS.to} variant="support" fullWidth className="mt-3.5 min-h-12">
        Veja como funciona
      </Button>
    </section>
  )
}
```

`frontend/src/pages/Projects.tsx` completo (grade desktop no mesmo modelo da Agenda):

```tsx
import { useMemo, useState } from 'react'
import { ProjectList } from '../components/projects/ProjectList'
import { SchoolsCallToAction } from '../components/projects/SchoolsCallToAction'
import { Button, ChipFilter, Container, EmptyState, PageHeader } from '../components/ui'
import { ALL_PROJECTS, filterProjects, projectCategoryOptions } from '../lib/projects'
import { useProjects } from '../services/projects'

export function Projects() {
  const { data: projects, isPending, isError, refetch } = useProjects()
  const [category, setCategory] = useState(ALL_PROJECTS)
  const options = useMemo(() => projectCategoryOptions(projects ?? []), [projects])
  const visible = filterProjects(projects ?? [], category)

  return (
    <Container className="pb-8 desktop:grid desktop:grid-cols-[15rem_minmax(0,1fr)] desktop:gap-x-14">
      <PageHeader
        className="desktop:col-start-1 desktop:col-end-3 desktop:row-start-1"
        overline="Conhecer"
        title="Projetos e atividades"
        lead="Contações de história performáticas e vivências brincantes. Todas se adaptam a qualquer espaço e têm classificação livre."
      />

      {projects && projects.length > 0 && (
        <aside aria-label="Filtrar projetos" className="mb-4 desktop:col-start-1 desktop:row-start-2 desktop:mb-0 desktop:border-t desktop:border-line desktop:pt-6">
          <ChipFilter label="Tipo de projeto" options={options} selected={category} onSelect={setCategory} listOnDesktop />
        </aside>
      )}

      <div className="flex flex-col gap-3 desktop:col-start-2 desktop:row-start-2 desktop:border-t desktop:border-line desktop:pt-6">
        {isPending && <p role="status" className="m-0 text-brown-400">Carregando os projetos…</p>}
        {isError && (
          <EmptyState
            tone="error"
            title="Não conseguimos carregar os projetos agora"
            text="A conexão pode ter falhado. Tente de novo em instantes."
            actions={
              <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                Tentar de novo
              </Button>
            }
          />
        )}
        {projects && projects.length === 0 && <EmptyState title="Nenhum projeto publicado ainda" />}
        {projects && projects.length > 0 && visible.length === 0 && <EmptyState title="Nenhum projeto nesta categoria por enquanto" />}
        {visible.length > 0 && <ProjectList projects={visible} />}
        {projects && <SchoolsCallToAction />}
      </div>
    </Container>
  )
}
```

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/projects.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 12: Verificação, documentação e revisão do PR 2

- [ ] **Passo 1:** `backend/`: `npm test`, `npm run test:db`, `npm run typecheck`; `frontend/`: `npm test`,
  `npm run typecheck`, `npm run lint`. Esperado: tudo verde.
- [ ] **Passo 2: verificação real** — `docker compose up` (aplica a migration), abrir `/projetos` e `/api-docs`;
  conferir os 11 projetos em ordem, as duas capas, o filtro e o Swagger. Chromium a 390, 320 (A+ e alto contraste)
  e 1440px, comparando com a tela 3b.
- [ ] **Passo 3: Changelog** — entrada "Página Projetos e atividades (RF03, tela 3b)": artefato, antes (404), depois
  (lista, filtro por categoria fechada, cards com capa e linhas sem capa, CTA de escolas), por quê, diferenças
  (11 projetos reais em ordem alfabética; textos de 4 projetos seguem o design; "50 min"/"Qualquer"; etiqueta de
  Brincadeiras com "A combinar"; categoria fechada nova, separada do gênero), confirmar com a ONG (classificação,
  textos do design), fora desta entrega (administração), PR `feat/projects-page`.
- [ ] **Passo 4:** linha no status do `CLAUDE.md`, linha no log de IA do `AGENTS.md`, rota no `backend/README.md`.
- [ ] **Passo 5: revisão antes do commit** — resumo do diff, pontos de atenção, e pedir autorização para os commits
  `feat(backend): RF03 projects table with the 11 projects and the public list`,
  `feat(frontend): RF03 projects page following screen 3b`, `docs: record the projects page …`, e depois push e PR.

---

# PR 3 — Detalhe do projeto (`feat/project-details`)

### Tarefa 13: `GET /api/projects/:slug`

**Arquivos:**
- Modificar: `backend/src/routes/projects.routes.ts`, `backend/src/docs/openapi.ts`, `backend/README.md`
- Teste: `backend/tests/projects.test.ts`, `backend/tests/integration/projects.integration.test.ts`

**Interfaces:**
- Consome: `getProject`, `projectParams` (Tarefa 9), `getPublishedProject`.
- Produz: `GET /api/projects/:slug` → `{ project: ProjectDetail }`; 404 `project_not_found`; 400 `invalid_data`.

- [ ] **Passo 0:** `git switch main && git pull --ff-only && git switch -c feat/project-details` (com o PR 2 já na `main`).

- [ ] **Passo 1: testes que falham** — em `backend/tests/projects.test.ts`:

```ts
describe('GET /api/projects/:slug', () => {
  it('returns a published project with every field', async () => {
    const findOne = jest.spyOn(Project, 'findOne').mockResolvedValue(fakeProject());

    const response = await request(app).get('/api/projects/cafu-e-o-cafe');

    expect(response.status).toBe(200);
    expect(response.body.project).toMatchObject({
      slug: 'cafu-e-o-cafe',
      description: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
      ageRating: 'Livre',
      venue: 'Qualquer',
      castMembers: 'Wil Oliveira',
      requirements: '1 caixa de som · 1 microfone headset',
    });
    expect(findOne.mock.calls[0]![0]!.where).toEqual({ slug: 'cafu-e-o-cafe', published: true });
  });

  it('answers 404 for a project that does not exist or is not published', async () => {
    jest.spyOn(Project, 'findOne').mockResolvedValue(null);
    const response = await request(app).get('/api/projects/banzo');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('project_not_found');
  });

  it('refuses an address outside the slug format without touching the database', async () => {
    const findOne = jest.spyOn(Project, 'findOne');
    const response = await request(app).get('/api/projects/Banzo');
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('invalid_data');
    expect(findOne).not.toHaveBeenCalled();
  });
});
```

e em `projects.integration.test.ts`:

```ts
  it('hides a project taken off the site from its old link', async () => {
    await Project.create({ slug: 'teste-fora-do-ar', title: 'Teste fora do ar', published: false });
    expect(await getPublishedProject('teste-fora-do-ar')).toBeNull();
    expect((await getPublishedProject('banzo'))?.castMembers).toBe('Wil Oliveira');
    await Project.destroy({ where: { slug: 'teste-fora-do-ar' } });
  });
```

(acrescentar `getPublishedProject` ao import de `../../src/services/projects.service` já feito na Tarefa 9).

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — `projects.routes.ts`:

```ts
import { Router } from 'express';
import { getProject, listProjects, projectParams } from '../controllers/projects.controller';
import { validate } from '../middlewares/validate';

export const projectsRoutes = Router();

projectsRoutes.get('/', listProjects);
projectsRoutes.get('/:slug', validate({ params: projectParams }), getProject);
```

`openapi.ts` — schema:

```ts
      ProjectDetail: {
        allOf: [
          { $ref: '#/components/schemas/ProjectSummary' },
          {
            type: 'object',
            required: ['description', 'ageRating', 'venue', 'castMembers', 'requirements'],
            properties: {
              description: { type: ['string', 'null'], description: 'Parágrafos separados por uma linha em branco.' },
              ageRating: { type: ['string', 'null'], example: 'Livre' },
              venue: { type: ['string', 'null'], example: 'Qualquer' },
              castMembers: { type: ['string', 'null'], example: 'Wil Oliveira' },
              requirements: { type: ['string', 'null'], example: '1 caixa de som · 1 microfone headset' },
            },
          },
        ],
      },
```

e path:

```ts
    '/projects/{slug}': {
      get: {
        tags: ['Projects'],
        summary: 'Um projeto publicado',
        parameters: [{ name: 'slug', in: 'path', required: true, schema: { type: 'string', pattern: '^[a-z0-9]+(?:-[a-z0-9]+)*$', maxLength: 80 } }],
        responses: {
          '200': { description: 'O projeto', content: { 'application/json': { schema: { type: 'object', properties: { project: { $ref: '#/components/schemas/ProjectDetail' } } } } } },
          '400': { description: 'Endereço fora do formato', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
          '404': { description: 'Não existe ou não está publicado', content: { 'application/json': { schema: { $ref: '#/components/schemas/Error' } } } },
        },
      },
    },
```

`backend/README.md`: `| GET | /api/projects/:slug | público | um projeto publicado (404 se fora do ar) |`.

- [ ] **Passo 4: rodar e ver passar** — `npm test`, `npm run test:db -- projects`, `npm run typecheck`.
- [ ] **Passo 5: checkpoint.**

### Tarefa 14: "Compartilhar" no topo do `FocusedLayout`

**Arquivos:**
- Criar: `frontend/src/components/layout/ShareButton.tsx`
- Modificar: `frontend/src/components/layout/Layout.tsx` (tipo `RouteHandle`), `frontend/src/components/layout/FocusedLayout.tsx`
- Teste: `frontend/src/tests/share.test.tsx` (novo)

**Interfaces:**
- Produz: `RouteHandle.share?: boolean`; `ShareButton()`. O `FocusedLayout` passa a ter `ToastProvider` (antes não tinha:
  só `Layout` e `AdminLayout` tinham).

- [ ] **Passo 1: testes que falham** — `frontend/src/tests/share.test.tsx`

```tsx
import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { FocusedLayout } from '../components/layout/FocusedLayout'
import { renderRoute } from './render'

function open(share: boolean) {
  renderRoute('/x', [{ element: <FocusedLayout />, children: [{ path: '/x', element: <p>conteúdo</p>, handle: { backTo: '/projetos', share } }] }])
}

describe('Share button in the focused layout', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('appears only on routes that ask for it', () => {
    open(false)
    expect(screen.queryByRole('button', { name: 'Compartilhar' })).not.toBeInTheDocument()
  })

  it('opens the native share sheet with the page address', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share })
    open(true)

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(share).toHaveBeenCalledWith(expect.objectContaining({ url: window.location.href }))
  })

  it('says nothing when the person closes the share sheet', async () => {
    vi.stubGlobal('navigator', { ...navigator, share: vi.fn().mockRejectedValue(new DOMException('cancel', 'AbortError')) })
    open(true)

    await userEvent.click(screen.getByRole('button', { name: 'Compartilhar' }))

    expect(screen.queryByText('Não foi possível copiar o link.')).not.toBeInTheDocument()
    expect(screen.queryByText('Link copiado.')).not.toBeInTheDocument()
  })

  it('copies the link when the browser cannot share', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    vi.stubGlobal('navigator', { ...navigator, share: undefined, clipboard: { writeText } })
    open(true)

    await act(async () => userEvent.click(screen.getByRole('button', { name: 'Compartilhar' })))

    expect(writeText).toHaveBeenCalledWith(window.location.href)
    expect(await screen.findByText('Link copiado.')).toBeInTheDocument()
  })
})
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — em `Layout.tsx`, no `RouteHandle`, acrescentar `share?: boolean`.

`frontend/src/components/layout/ShareButton.tsx`

```tsx
import { useToast } from '../ui'

export function ShareButton() {
  const toast = useToast()

  async function share() {
    const url = window.location.href
    if (navigator.share) {
      // Rejects when the person closes the sheet: nothing to report.
      await navigator.share({ title: document.title, url }).catch(() => undefined)
      return
    }
    try {
      await navigator.clipboard.writeText(url)
      toast('Link copiado.')
    } catch {
      toast('Não foi possível copiar o link.', { tone: 'error' })
    }
  }

  return (
    <button
      type="button"
      onClick={() => void share()}
      className="inline-flex min-h-11 cursor-pointer items-center rounded-control border-[1.5px] border-brown bg-transparent px-3.5 text-small font-semibold text-brown"
    >
      Compartilhar
    </button>
  )
}
```

`FocusedLayout.tsx` — ler o `share` dos `handle` como já se lê o `backTo`, envolver tudo em `ToastProvider` e pôr o
botão à direita do cabeçalho:

```tsx
import { ToastProvider } from '../ui/ToastProvider'
import { ShareButton } from './ShareButton'

  const handles = useMatches().map((match) => match.handle as RouteHandle | undefined)
  const defaultBack = handles.map((handle) => handle?.backTo).findLast(Boolean)
  const canShare = handles.some((handle) => handle?.share)
```

(substitui o `useMatches().map(...).findLast(Boolean)` atual), e no JSX:

```tsx
    <ToastProvider>
      <div className="flex min-h-dvh flex-col">
        <SkipLink />
        <header className="border-b border-line">
          <div className="mx-auto flex h-15 max-w-xl items-center px-1 pr-2">
            <Link …mesmo link de voltar de hoje… />
            <span className="flex-1" />
            {canShare && <ShareButton />}
          </div>
        </header>
        <main …mesmo main de hoje…>
          <Outlet />
        </main>
      </div>
    </ToastProvider>
```

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/share.test.tsx src/tests/registration.test.tsx src/tests/auth.test.tsx`
  (as telas que já usam o `FocusedLayout` continuam iguais).
- [ ] **Passo 5: checkpoint.**

### Tarefa 15: Página `/projetos/:slug`

**Arquivos:**
- Criar: `frontend/src/pages/ProjectDetail.tsx`, `frontend/src/components/projects/ProjectCover.tsx`,
  `FactStrip.tsx`, `TechnicalSheet.tsx`
- Modificar: `frontend/src/routes.tsx` (filhos do `FocusedLayout`)
- Teste: `frontend/src/tests/project-detail.test.tsx` (novo)

**Interfaces:**
- Consome: `useProject(slug)`, `ProjectDetail` (Tarefa 10); `SCHOOLS`; `CONTACTS.whatsapp`; `ActionBar`, `Button`,
  `EmptyState`; `NotFound`; `handle.share` (Tarefa 14).
- Produz: `ProjectDetail()` (página), `ProjectCover`, `FactStrip`, `TechnicalSheet`.

- [ ] **Passo 1: testes que falham** — `frontend/src/tests/project-detail.test.tsx`

```tsx
import { screen } from '@testing-library/react'
import { api } from '../services/api'
import type { ProjectDetail } from '../types/project'
import { apiError, mockApi } from './auth-support'
import { renderRoute } from './render'

function detail(overrides: Partial<ProjectDetail> = {}): ProjectDetail {
  return {
    slug: 'cafu-e-o-cafe',
    title: 'Cafú e o Café',
    summary: null,
    genre: 'Contação de história',
    duration: '50 min',
    category: 'storytelling',
    coverUrl: '/images/sector-literary.jpg',
    coverAlt: 'Wil Oliveira cercado de exemplares do livro infantil Cafú e o Café, de sua autoria.',
    description: 'Primeiro parágrafo.\n\nSegundo parágrafo.',
    ageRating: 'Livre',
    venue: 'Qualquer',
    castMembers: 'Wil Oliveira',
    requirements: '1 caixa de som · 1 microfone headset',
    ...overrides,
  }
}

async function openProject(project: ProjectDetail) {
  vi.mocked(api.get).mockResolvedValue({ data: { project } })
  renderRoute(`/projetos/${project.slug}`)
  return screen.findByRole('heading', { level: 1, name: project.title })
}

describe('Project detail page', () => {
  it('shows screen 3c: back link, share, cover, facts, description and technical sheet', async () => {
    await openProject(detail())

    expect(screen.getByRole('link', { name: 'Projetos' })).toHaveAttribute('href', '/projetos')
    expect(screen.getByRole('button', { name: 'Compartilhar' })).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Cafú e o Café/ })).toHaveAttribute('src', '/images/sector-literary.jpg')
    expect(screen.getByText('Contação de história')).toBeInTheDocument()
    expect(screen.getByText('Duração').nextSibling).toHaveTextContent('50 min')
    expect(screen.getByText('Primeiro parágrafo.')).toBeInTheDocument()
    expect(screen.getByText('Segundo parágrafo.')).toBeInTheDocument()
    expect(screen.getByText('Ficha técnica')).toBeInTheDocument()
    expect(screen.getByText('Rider').nextSibling).toHaveTextContent('1 caixa de som · 1 microfone headset')
    expect(screen.getByRole('link', { name: 'Levar para minha escola' })).toHaveAttribute('href', '/para-escolas')
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
  })

  it('drops what the project does not have and keeps the image space with the logo', async () => {
    await openProject(detail({ slug: 'eu-griot', title: 'Eu Griot', coverUrl: null, coverAlt: null, duration: null, description: null, castMembers: null, requirements: null }))

    expect(screen.queryByText('Duração')).not.toBeInTheDocument()
    expect(screen.getByText('Idade')).toBeInTheDocument()
    expect(screen.queryByText('Ficha técnica')).not.toBeInTheDocument()
    expect(screen.getByTestId('cover-placeholder')).toHaveAttribute('aria-hidden', 'true')
  })

  it('shows "page not found" for a project that is missing or off the site', async () => {
    mockApi({ 'GET /projects/banzo': () => apiError(404, 'project_not_found', 'Não encontramos esse projeto.') })
    renderRoute('/projetos/banzo')
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('shows "page not found" for an address outside the slug format', async () => {
    mockApi({ 'GET /projects/Banzo': () => apiError(400, 'invalid_data', 'Confira os dados enviados.') })
    renderRoute('/projetos/Banzo')
    expect(await screen.findByRole('heading', { name: 'Página não encontrada' })).toBeInTheDocument()
  })

  it('offers a retry when the connection fails', async () => {
    mockApi({ 'GET /projects/banzo': () => 'network-error' })
    renderRoute('/projetos/banzo')
    expect(await screen.findByText('Não conseguimos carregar o projeto agora')).toBeInTheDocument()
  })
})
```

- [ ] **Passo 2: rodar e ver falhar.**

- [ ] **Passo 3: implementar** — `frontend/src/components/projects/ProjectCover.tsx`

```tsx
import type { ProjectDetail } from '../../types/project'

export function ProjectCover({ project }: { project: Pick<ProjectDetail, 'coverUrl' | 'coverAlt'> }) {
  if (project.coverUrl) {
    return <img src={project.coverUrl} alt={project.coverAlt ?? ''} width={1200} height={900} className="block aspect-[4/3] w-full object-cover" />
  }
  return (
    <div data-testid="cover-placeholder" aria-hidden="true" className="grid aspect-[4/3] w-full place-items-center bg-cream-dark">
      <img src="/images/logo.png" alt="" width={120} className="w-30 opacity-35 grayscale" />
    </div>
  )
}
```

`FactStrip.tsx`

```tsx
import { cn } from '../../lib/cn'
import type { ProjectDetail } from '../../types/project'

const COLUMNS = { 1: 'grid-cols-1', 2: 'grid-cols-2', 3: 'grid-cols-3' } as const

export function FactStrip({ project }: { project: Pick<ProjectDetail, 'duration' | 'ageRating' | 'venue'> }) {
  const facts = [
    { label: 'Duração', value: project.duration },
    { label: 'Idade', value: project.ageRating },
    { label: 'Local', value: project.venue },
  ].filter((fact) => fact.value)
  if (facts.length === 0) return null

  return (
    <dl className={cn('m-0 mt-1.5 grid border-y border-line', COLUMNS[facts.length as 1 | 2 | 3])}>
      {facts.map((fact) => (
        <div key={fact.label} className="flex min-w-0 flex-col gap-0.5 py-3 not-first:border-l not-first:border-line not-first:pl-3">
          <dt className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-brown-400">{fact.label}</dt>
          <dd className="m-0 text-body font-bold break-words">{fact.value}</dd>
        </div>
      ))}
    </dl>
  )
}
```

`TechnicalSheet.tsx`

```tsx
import type { ProjectDetail } from '../../types/project'

export function TechnicalSheet({ project }: { project: Pick<ProjectDetail, 'castMembers' | 'requirements'> }) {
  const rows = [
    { label: 'Elenco', value: project.castMembers },
    { label: 'Rider', value: project.requirements },
  ].filter((row) => row.value)
  if (rows.length === 0) return null

  return (
    <details open className="mt-2.5 border-y border-line">
      <summary className="flex min-h-13 cursor-pointer list-none items-center text-item font-bold">Ficha técnica</summary>
      <dl className="m-0 grid grid-cols-[6rem_minmax(0,1fr)] gap-x-3 gap-y-2 pb-4 text-[0.9375rem] leading-[1.45]">
        {rows.map((row) => (
          <div key={row.label} className="contents">
            <dt className="text-brown-400">{row.label}</dt>
            <dd className="m-0">{row.value}</dd>
          </div>
        ))}
      </dl>
    </details>
  )
}
```

`frontend/src/pages/ProjectDetail.tsx`

```tsx
import { useParams } from 'react-router-dom'
import { FactStrip } from '../components/projects/FactStrip'
import { ProjectCover } from '../components/projects/ProjectCover'
import { TechnicalSheet } from '../components/projects/TechnicalSheet'
import { ActionBar, Button, EmptyState } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { SCHOOLS } from '../lib/navigation'
import { useProject } from '../services/projects'
import { NotFound } from './NotFound'

const NOT_FOUND_STATUSES = [400, 404]

export function ProjectDetail() {
  const { slug } = useParams()
  const { data: project, isPending, isError, error, refetch } = useProject(slug)

  if (isError) {
    const status = (error as { response?: { status?: number } }).response?.status
    if (status && NOT_FOUND_STATUSES.includes(status)) return <NotFound />
    return (
      <EmptyState
        tone="error"
        title="Não conseguimos carregar o projeto agora"
        text="A conexão pode ter falhado. Tente de novo em instantes."
        actions={
          <Button variant="secondary" size="compact" onClick={() => void refetch()}>
            Tentar de novo
          </Button>
        }
      />
    )
  }
  if (isPending) return <p role="status" className="m-0 text-brown-400">Carregando o projeto…</p>

  const paragraphs = project.description?.split(/\n\s*\n/).filter(Boolean) ?? []

  return (
    <article className="pb-28 desktop:pb-0">
      <div className="-mx-4 -mt-7">
        <ProjectCover project={project} />
      </div>
      <div className="flex flex-col gap-2.5 pt-5">
        {project.genre && <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-blue-deep">{project.genre}</p>}
        <h1 className="m-0 text-h1 font-bold">{project.title}</h1>
        <FactStrip project={project} />
        {paragraphs.map((paragraph, index) => (
          <p key={index} className={index === 0 ? 'm-0 mt-2 text-body leading-[1.6]' : 'm-0 text-body leading-[1.6]'}>
            {paragraph}
          </p>
        ))}
        <TechnicalSheet project={project} />
      </div>
      <ActionBar
        primary={
          <Button to={SCHOOLS.to} variant="applique" className="min-h-13 w-full desktop:w-auto desktop:px-8">
            Levar para minha escola
          </Button>
        }
        secondary={
          <Button href={CONTACTS.whatsapp} variant="secondary" className="min-h-13">
            WhatsApp
          </Button>
        }
      />
    </article>
  )
}
```

Em `routes.tsx`, nos filhos do `FocusedLayout`:
`{ path: '/projetos/:slug', element: <ProjectDetail />, handle: { backTo: '/projetos', share: true } }`.

- [ ] **Passo 4: rodar e ver passar** — `npx vitest run src/tests/project-detail.test.tsx`
- [ ] **Passo 5: checkpoint.**

### Tarefa 16: Verificação, documentação e revisão do PR 3

- [ ] **Passo 1:** `backend/`: `npm test`, `npm run test:db`, `npm run typecheck`; `frontend/`: `npm test`,
  `npm run typecheck`, `npm run lint`.
- [ ] **Passo 2: verificação real** — `/projetos/cafu-e-o-cafe` (com capa), `/projetos/eu-griot` (sem capa, sem
  duração, sem descrição), `/projetos/Banzo` e `/projetos/nao-existe` (página não encontrada); "Compartilhar" no
  celular real ou no DevTools (com e sem Web Share); Chromium a 390, 320 (A+ e alto contraste) e 1440px, comparando
  com a tela 3c; barra de ação não cobre o fim do conteúdo.
- [ ] **Passo 3: Changelog** — entrada "Página de cada projeto (RF03, tela 3c)": antes (404), depois (capa ou espaço
  com logo, faixa de números flexível, descrição em parágrafos, ficha técnica, barra de ação, compartilhar), por quê,
  diferenças (espaço com logo quando não há capa; células sem dado somem; `FocusedLayout` ganhou "Compartilhar" e
  `ToastProvider`), PR `feat/project-details`.
- [ ] **Passo 4:** status no `CLAUDE.md`, log de IA no `AGENTS.md`, rota no `backend/README.md`; avisar o Antonio sobre
  a mudança no `FocusedLayout` na descrição do PR.
- [ ] **Passo 5: revisão antes do commit** — resumo do diff, pontos de atenção, pedir autorização para os commits
  `feat(backend): RF03 project detail endpoint`, `feat(frontend): RF03 project page following screen 3c` e
  `docs: record the project page …`, e depois push e PR.
