# Spec — páginas Sobre, Projetos e Detalhe do projeto

- **Data:** 2026-10-09
- **Autor:** Yuri Oliveira, com apoio de IA (Claude Code + Superpowers `brainstorming`)
- **Escopo:** recriar na V2 três páginas que existem na V1 e ainda não existem aqui
- **Fora do escopo (por enquanto):** administração de projetos (`/admin/atividades` na V1), upload de capa

## 1. Objetivo e critério de sucesso

O time está recriando na V2 as páginas da V1 (`oliveira-yuri/venturus-atelie`, branch `migracao-nextjs`). Hoje
os links "Quem somos" e "Projetos" do menu, da barra inferior e da home caem no 404. Este spec cobre:

| Página | Rota V2 | Rota V1 | Tela do design | Requisito |
|---|---|---|---|---|
| Sobre | `/quem-somos` | `/quem-somos` | 5b | RF02 |
| Projetos | `/projetos` | `/projetos` | 3b | RF03 (parte pública) |
| Detalhe do projeto | `/projetos/:slug` | `/projetos/[id]` | 3c | RF03 (parte pública) |

**Pronto quando:** as três rotas abrem com os 11 projetos reais, a interface reproduz fielmente as telas 5b, 3b e
3c do Claude Design ("Análise UX/UI da migração Next.js"), e os testes, o typecheck e o lint passam nas duas pastas.

## 2. Fontes e regra de prioridade

1. **Design (`Analise UX-UI.dc.html`)** define layout, componentes, cores, tipografia, espaçamentos **e o texto**.
   Decisão do Yuri: fidelidade total às telas 5b, 3b e 3c.
2. **Repositório V2** define como implementar: tokens de `frontend/src/styles.css`, componentes de
   `components/ui`, `Layout`/`FocusedLayout`, camadas do backend.
3. **V1** é referência de dados e comportamento (projetos, campos, ficha técnica).

Método de conversão: o HTML de cada tela é tirado do `.dc.html` (5b = linhas 277–390, 3b = 867–926,
3c = 939–968), sem a moldura de celular, e convertido para JSX. Cada `style` inline vira classe Tailwind com o
token equivalente — as cores do design batem 1:1 com os tokens (`#2B2019` → `brown`, `#9A6A12` → `ochre-deep`,
`#6E5B45` → `brown-400`, `#4A3A2A` → `brown-600`, `#D8CBB8` → `cream-dim`, `#EFE6D6` → `cream-dark`,
`#FFFDF7` → `card`, `#2F6D96` → `blue-deep`, `#D69A10` → `ochre`). Tamanhos em `rem`. Cabeçalho, rodapé e barra
inferior não são recriados: vêm do `Layout` da base.

## 3. Decisões

| # | Decisão |
|---|---|
| F1 | Fidelidade total ao design, inclusive textos resumidos e placeholders de imagem (ver §4.1 e §7) |
| F2 | Mobile é o foco. O design não tem desktop para 3b e 3c: Projetos segue a Agenda desktop (6b) e o Detalhe segue o detalhe do evento (13a), ambos já no código. Prévia aprovada pelo Yuri em 2026-10-15 |
| F3 | Links para rotas que outros integrantes ainda vão criar (`/voluntariado`, `/doar`, `/para-escolas`) apontam para a rota final, a partir das constantes de `lib/navigation.ts` — mesma convenção do menu público |
| F4 | Mapa: iframe do Google Maps sem chave (`https://www.google.com/maps?q=<endereço>&output=embed`), endereço de `CONTACTS.address`. A Maps Embed API (chave restrita por domínio) fica para depois |
| F5 | Índice de chips do Sobre: links âncora com o visual do `ChipFilter`, sticky, com destaque da seção visível por `IntersectionObserver` e `aria-current="location"` |
| F6 | Os 11 projetos entram no MySQL pela migration que cria a tabela (não pelo seed, que é só de desenvolvimento) |
| F7 | Filtro por categoria fechada (`storytelling`, `experience`, `play`), separada do `genre` (texto livre que aparece na etiqueta) |
| F8 | Classificação: Contação — Banzo, Catirina e Nego Dito, Cafú e o Café, A Cabaça e o Canto Ancestral, Eu Griot, Memória Negra; Vivência — Brincadeiras Encantadas na Mata, Projeto Brincantes, Batuque na Cozinha; Peça — Brasil Negreiro; sem categoria (só em "Todas") — Ateliê Afro Cultural Itinerante. A confirmar com a ONG |
| F9 | Chave UUID + `slug` único, gerado do título e fixo (`/projetos/banzo`); os 11 mantêm os slugs da V1 |
| F10 | Ordem alfabética pelo título |
| F11 | Capas reais só em Cafú e o Café (`/images/sector-literary.jpg`) e Brasil Negreiro (`/images/sector-musical.jpg`), com o alt já usado na home; os demais aparecem como linha na lista, fiel ao 3b. As fotos reais de `backend/seed-content/images/` ficam para um PR seguinte (decisão do Yuri, 2026-10-15) |
| F12 | Detalhe sem capa: espaço decorativo 4/3 em `cream-dark` com o logo em cinza (`aria-hidden`) |
| F13 | "Compartilhar": reusa `components/news/ShareButton` (Web Share API; sem suporte, copia o link e avisa com `useToast`) |
| F14 | O Detalhe usa o `Layout` com `handle: { hideHeaderOnMobile: true }`, como `/agenda/:id`. No celular, o topo é o `BackBar` "‹ Projetos" com o `ShareButton` à direita, por uma prop opcional `action` (extensão aditiva — avisar o Antonio); no desktop, `BackLink` |
| F15 | Faixa de números do detalhe: célula sem dado some (2 ou 1 colunas) |

## 4. Páginas

### 4.1 Sobre — `/quem-somos` (tela 5b)

Ordem dos blocos, igual ao 5b: hero (`hero-portrait.jpg` 4/5 + card aplique com overline "Quem somos", H1
"Um espaço educativo de **reflexão, criação** e valorização da cultura e memória afro-brasileira" e
"Casa Verde, zona norte de São Paulo · desde 2020") → índice de chips (Sankofa, Quem idealizou, Setores, Onde
estamos) → bloco escuro Sankofa (placeholder "Símbolo Sankofa (arte da ONG)", citação, texto) → faixa listrada →
Quem idealizou (placeholder "Foto de Wil e Nathy", nomes como H2, texto, etiquetas de habilidade, linha do tempo
com "Janeiro de 2020" e "Rede nacional") → Nossos três setores (3 cards com `sector-*.jpg`, números 01/02/03,
etiquetas de ritmos no Musical) → Para quem → Onde estamos (texto, caixa sobre racismo, mapa, endereço, "Como
chegar") → CTA escuro ("Conhecer nossos projetos" → `/projetos`, "Ser voluntário" → `/voluntariado`,
"Apoiar" → `/doar`). Os textos são os do 5b, letra por letra.

- Os cards de setor não são links (o design não define destino).
- "Como chegar" é link externo para o Google Maps com o endereço.
- Imagens e alt dos setores saem de um módulo compartilhado com a home (hoje dentro de
  `components/home/WhatWeDo.tsx`), sem mudar o texto da home.
- Página estática: só frontend.

### 4.2 Projetos — `/projetos` (tela 3b)

`PageHeader` (overline "Conhecer", H1 "Projetos e atividades", lead do 3b) → chips com o `ChipFilter`
("Todas · 11", "Contação", "Vivência", "Peça" — filtro no navegador sobre a lista já carregada) → lista:
projeto com capa vira card grande (capa 16/9, etiqueta, H2, resumo); sem capa vira linha (etiqueta, título,
resumo se houver, chevron). O card ou a linha inteira é o link para `/projetos/:slug`. Fecha com o bloco escuro
"Quer levar uma destas para a sua escola?" e o botão "Veja como funciona" → `/para-escolas`. Etiqueta =
`genre · duration` (só os campos preenchidos).

Desktop (≥ 1024px), igual à Agenda: grid `15rem minmax(0,1fr)`; à esquerda, `ChipFilter` com `listOnDesktop` e o
`SchoolsPromo` da agenda; à direita, a lista. O bloco escuro de escolas do fim só aparece no celular (`desktop:hidden`).

Estados: carregando (`role="status"`), falha (`EmptyState tone="error"` + "Tentar de novo"), lista vazia
(`EmptyState`), filtro sem resultado (`EmptyState`).

### 4.3 Detalhe — `/projetos/:slug` (tela 3c)

Rota no `Layout` (F14): topo "‹ Projetos" + "Compartilhar". Corpo: capa 4/3 de borda a borda (ou o
espaço com logo, F12) → overline com `genre` → H1 → faixa Duração · Idade · Local (F15) → descrição em
parágrafos (separados por linha em branco; some se vazia) → "Ficha técnica" em `<details open>` com Elenco e
Rider (some se os dois estiverem vazios) → barra fixa com "Levar para minha escola" → `/para-escolas` e
"WhatsApp" → `CONTACTS.whatsapp`, no mesmo molde da barra do `EventDetail` (`desktop:hidden`).

Desktop, igual ao `EventDetail`: grid `minmax(0,1fr) 25rem`. À esquerda: `BackLink`, overline, H1, capa e
descrição. À direita, cartão `sticky` (`border-brown`, `bg-card`): faixa de números, ficha técnica, "Levar para
minha escola", "WhatsApp" e "Compartilhar".

Estados: carregando, falha com "Tentar de novo", e `<NotFound/>` para slug inexistente ou projeto fora do ar.

## 5. Dados

### 5.1 Tabela `projects` (migration nova, mesmo padrão de `create-events`)

| Coluna | Tipo | Observação |
|---|---|---|
| `id` | UUID, PK | |
| `slug` | `STRING(80)`, único, não nulo | `^[a-z0-9]+(?:-[a-z0-9]+)*$` |
| `title` | `STRING(160)`, não nulo | |
| `summary` | `STRING(400)`, nulo | |
| `description` | `TEXT`, nulo | parágrafos separados por `\n\n` |
| `genre`, `duration`, `age_rating`, `venue`, `cast_members`, `requirements` | `STRING(200)`, nulo | `cast` é palavra reservada do SQL |
| `category` | `STRING(20)`, nulo | `CHECK (category IN ('storytelling','experience','play'))` |
| `cover_url`, `cover_alt` | `STRING(255)`, nulo | `CHECK (cover_url IS NULL OR (cover_alt IS NOT NULL AND cover_alt <> ''))` |
| `published` | `BOOLEAN`, não nulo, padrão `false` | mesmo nome de `events.published` |
| `created_at`, `updated_at` | `DATE` | |

Índice em `(published, title)`.

### 5.2 Carga dos 11 projetos (na mesma migration)

Origem: `dados-iniciais/atividades.json` da V1, todos com `published = true`. Onde o design mostra um projeto,
os campos exibidos seguem o design (F1):

| Projeto (slug) | Diferença em relação à V1 |
|---|---|
| `cafu-e-o-cafe` | `genre` "Contação de história"; `duration` "50 min"; `venue` "Qualquer"; capa F11 |
| `banzo` | `genre` "Contação performática"; `duration` "50 min"; `summary` "Sobre a saudade da pátria e da liberdade sentida pelos africanos escravizados." |
| `catirina-e-nego-dito` | `genre` "Fantoches"; `duration` "50 min"; `summary` "Fantoches e música ao vivo, a partir da história do auto do boi." |
| `brincadeiras-encantadas-na-mata` | `genre` "História-brincante"; `summary` "Uma aventura de faz de conta pela mata, para crianças e adultos."; `duration` continua "A combinar" (V1), então a etiqueta mostra "História-brincante · A combinar" |
| `eu-griot`, `batuque-na-cozinha` | iguais à V1 (o design repete o `genre` da V1) |
| demais | iguais à V1; `duration` "50 minutos" → "50 min" e `venue` "Adaptável a qualquer espaço" → "Qualquer", no formato do design |

Brasil Negreiro recebe a capa F11. `age_rating` "Livre" em todos. `description`, `cast_members` e
`requirements` vêm da V1 sem mudança.

### 5.3 API

`GET /api/projects` — publicados, em ordem alfabética, com os campos da lista (`slug`, `title`, `summary`,
`genre`, `duration`, `category`, `coverUrl`, `coverAlt`).

`GET /api/projects/:slug` — um projeto publicado com todos os campos; inexistente ou fora do ar →
`404 project_not_found` (`ApiError`). Slug validado com Zod em `validators/projects.validator.ts`.

Camadas como em eventos: `routes/projects.routes.ts` → `controllers/projects.controller.ts` (usa o schema de `validators/`) →
`services/projects.service.ts` (mapeia modelo → DTO) → `models/project.model.ts`. Montagem em
`routes/index.ts` (`/projects`). Documentação em `docs/openapi.ts`.

## 6. Frontend — arquivos

| Arquivo | Conteúdo |
|---|---|
| `src/types/project.ts` | `ProjectSummary`, `ProjectDetail`, `ProjectCategory` |
| `src/services/projects.ts` | `useProjects()`, `useProject(slug)` (React Query; `retry: false` no detalhe) |
| `src/pages/About.tsx` + `src/components/about/*` | blocos do 5b |
| `src/pages/Projects.tsx` + `src/components/projects/ProjectCard.tsx`, `ProjectRow.tsx` | 3b; reusa `ChipFilter` e `components/agenda/SchoolsPromo` |
| `src/pages/ProjectDetail.tsx` + `src/components/projects/FactStrip.tsx`, `TechnicalSheet.tsx` | 3c; reusa `components/news/ShareButton` |
| `src/components/layout/BackBar.tsx` | prop opcional `action` (botão à direita, só no celular) |
| `src/lib/sectors.ts` | imagens e alt dos setores, usados pela home e pelo Sobre |
| `src/routes.tsx` | `/quem-somos`, `/projetos` e `/projetos/:slug` (com `hideHeaderOnMobile`) no `Layout` |

## 7. Divergências registradas (Changelog)

- Overline "Quem somos" e faixa listrada após o Sankofa seguem o 5b, contrariando duas regras de layout do
  `CLAUDE.md` ("sobretítulo = seção do menu", "tela não desenha faixa"). Escolha do Yuri por fidelidade ao design.
- Texto do Sobre resumido (5b) em vez do texto literal da V1: o RF02 pede o texto "palavra por palavra" — a ONG
  precisa aprovar o resumo.
- Placeholders "Símbolo Sankofa (arte da ONG)" e "Foto de Wil e Nathy" ficam visíveis até a ONG enviar o material.
- Dados de quatro projetos (§5.2) seguem os textos do design, diferentes da V1.
- A lista mostra os 11 projetos reais (o 3b mostra 6 como exemplo) em ordem alfabética; a etiqueta de
  Brincadeiras Encantadas na Mata inclui "A combinar", que o 3b não mostra.
- O RF03 inclui a administração (criar, editar, subir capa), que fica para um próximo ciclo.

## 8. Testes

**Backend (Jest)** — unitários com `supertest` e modelos mockados; integração contra MySQL (`npm run test:db`):
lista só publicados e em ordem; projeto fora do ar não aparece na lista e dá 404 no detalhe; slug inválido → 400;
slug inexistente → 404; migration cria os 11 com as categorias e capas previstas; restrições `CHECK`.

**Frontend (Vitest + Testing Library)** — Sobre: rota renderiza, textos-chave do 5b presentes, links do CTA
vindos de `navigation.ts`, iframe com `title`, nenhuma imagem sem `alt`, chip ativo com `aria-current`
(`IntersectionObserver` simulado no próprio teste). Projetos: lista, chips filtram, card × linha conforme capa,
link para o slug, estados. Detalhe: dados renderizados, faixa e ficha somem quando vazias, espaço com logo sem
capa, 404, botão "Compartilhar" no topo e no cartão, links da barra de ação, cartão lateral no desktop.
`BackBar`: botão à direita só quando recebe `action`.

**Verificação manual:** Chromium a 390px, 320px (A+ e alto contraste) e 1440px, lado a lado com as telas do
design; sem rolagem horizontal; alvos ≥ 44px; navegação por teclado.

## 9. Entrega em PRs

| PR | Branch | Conteúdo | Depende de |
|---|---|---|---|
| 1 | `feat/about-page` | Sobre (só frontend) | — |
| 2 | `feat/projects-page` | tabela, migration com os 11, `GET /api/projects`, página Projetos | — |
| 3 | `feat/project-details` | `GET /api/projects/:slug`, página Detalhe, prop `action` do `BackBar` | PR 2 |

Cada PR atualiza, no mesmo pacote: `docs/04_Gerencia_de_Mudancas/Changelog.md`, a tabela de status do
`CLAUDE.md`, a linha do log de IA no `AGENTS.md`, o `openapi.ts` e o `backend/README.md` quando há rota nova.
Implementação em blocos pequenos, com aprovação do Yuri a cada bloco; nada de commit, push ou PR sem autorização.

## 10. Pendências

| Pendência | Responsável |
|---|---|
| Arte do símbolo Sankofa e foto de Wil e Nathy | ONG |
| Aprovar o texto resumido do Sobre e os textos dos projetos do design | ONG |
| Confirmar a classificação F8 | ONG |
| Avisar o Antonio sobre a prop `action` do `BackBar` e as duas regras de layout não seguidas | Yuri |
| Capas com as fotos reais de `backend/seed-content/images/` | próximo PR |
| Maps Embed API com chave restrita; `frame-src https://www.google.com` na CSP do deploy | equipe |
| `/para-escolas`, `/voluntariado` e `/doar` (links já apontam para elas) | outros integrantes |
| Administração de projetos e upload de capa | próximo ciclo |
