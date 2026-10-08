# Ateliê Afro Cultural — guia do projeto

Sistema web do **Ateliê Afro Cultural**, ONG de arte, cultura e memória afro-brasileira na Casa
Verde, zona norte de São Paulo. Equipe g3x da Fatec Campinas, **Fatec Innovation Challenge 2026**.

## Fontes de verdade

| O quê | Onde |
|---|---|
| Regras da competição, stack, RNFs e estrutura do repositório | Regulamento Técnico do FIC 2026 (Anexos I, III e V) |
| Escopo aprovado (proposta, requisitos, arquitetura, protótipos) | `docs/originais/` — congelada, nunca editar |
| Evolução dos artefatos | `docs/01_Requisitos/` … `docs/05_Apresentacao/` |
| O que mudou e por quê | `docs/04_Gerencia_de_Mudancas/Changelog.md` |
| Uso de IA e regras para agentes | `AGENTS.md` |
| Projeto de origem (conteúdo real, regras de negócio já decididas) | repositório `oliveira-yuri/venturus-atelie`, branch `migracao-nextjs` |
| Design: o que cada tela deve ser | Claude Design, "Análise UX/UI" (rodadas 1–5) — telas citadas pelo código como 2a, 3a, 6a… |
| Design: em que ordem migrar | Claude Design, "Plano de Migração" (fases F0–F8) |

Este repositório **reconstrói do zero** o site de `venturus-atelie` (Next.js + Supabase) na stack
obrigatória do regulamento. O código de lá não é copiado; o **conteúdo real da ONG** e as **regras
de negócio já decididas** são a referência. Nunca inventar texto: faltou, perguntar.

## Manter este arquivo atualizado

Ao terminar, acrescentar ou modificar uma funcionalidade, atualize a tabela de status no mesmo PR.
`pronto` só depois de rodar e ver funcionando — não o que se pretende.

## Comandos

```bash
docker compose up --build                       # MySQL + API + front-end
docker compose exec backend npm run db:migrate  # migrations

cd backend  && npm test && npm run typecheck    # Jest + Supertest (sem banco)
cd frontend && npm test && npm run typecheck && npm run lint
```

API em `:3333/api`, Swagger em `:3333/api-docs`, front em `:5173`.

## Regras invioláveis

**Do regulamento** (descumprir desclassifica ou perde ponto):

1. **Stack obrigatória** (Anexo III): React + Vite + TypeScript; Node.js + Express (TypeScript);
   MySQL + Sequelize. Monorepo com `frontend/` e `backend/`.
2. **Estrutura obrigatória** (Anexo I, 3.2): a árvore do `README.md` da raiz. Não criar pastas na
   raiz sem decisão da equipe.
3. **`docs/originais/` é intocável.** Nem formatação, nem renomear arquivo.
4. **RNFs obrigatórios não se alteram nem se removem** — só se ampliam. Os do back-end:
   JWT com rotas protegidas, hash de senha, validação de entrada, CORS restrito, segredos em
   variável de ambiente, Swagger em `/api-docs`, testes automatizados, REST com
   controllers/services/models, Sequelize, async/await com tratamento de erro. Os do front-end:
   TypeScript, componentes funcionais reutilizáveis, hooks/Context/React Query/Axios,
   react-router-dom, estilo consistente e responsivo (Tailwind).
   **Consequência que não é óbvia:** o projeto de origem guardava a autorização no banco (RLS do
   PostgreSQL). MySQL não tem RLS — **aqui a autorização mora nos services do back-end**. Toda
   consulta que toca dado pessoal filtra por quem pede, no service, e tem teste que tenta ler o
   dado de outra pessoa. Esquecer o filtro não dá erro: devolve dado demais em silêncio.
5. **Gerência de mudanças:** mudou User Story, arquitetura ou protótipo → entrada no `Changelog.md`
   no mesmo PR. Ajuste refina a implementação; **não altera a proposta aprovada**.
6. **A versão final vive na `main`** e corresponde ao deploy avaliado (RNF-REP-02).

**Da ONG** (herdadas do projeto de origem, continuam valendo):

7. **Não é ONG assistencialista.** É arte, cultura e identidade do povo negro. Nada de estética de
   pena, linguagem de caridade ou contador de "vidas salvas".
8. **Nunca inventar conteúdo.** Sem lorem ipsum, sem evento ou depoimento fictício. Campo sem dado
   fica nulo e a tela omite a seção.
9. **A paleta é da ONG**, com significado declarado por ela (ocre = luz/sabedoria, azul =
   céu/esperança, marrom = terra/raízes). Alterar é decisão do grupo.
10. **Mobile-first no painel.** A ONG não tem computador: toda operação é no celular da equipe.
11. **Acessibilidade é requisito** (e critério de desempate, Anexo IV, seção 5): contraste, foco
    visível, navegação por teclado, rótulos, HTML semântico, leitor de tela, controle de tamanho de
    texto. Nunca `vw` em tamanho de texto.
12. **Nenhuma foto no ar sem autorização de uso de imagem** registrada. O público inclui crianças a
    partir de 10 anos.
13. **O papel de equipe nunca vem do cadastro.** Ninguém se promove pela API; o back-end ignora
    qualquer campo de papel vindo do corpo da requisição (os esquemas Zod descartam campo
    desconhecido).
14. **Verificar olhando.** Teste verde não substitui abrir a tela. Neste repositório já aconteceu:
    35 testes verdes com o "Apoiar" aparecendo no cabeçalho do celular e o foco sendo roubado na
    carga da página — os dois só apareceram no Chromium, a 390px.

## Regras do layout (Análise UX/UI)

Valem para toda tela nova. Os tokens estão em `frontend/src/estilos.css` (bloco `@theme`).

- **Creme domina; marrom é texto e ação principal.** Ocre só em "Apoiar", estado ativo, contagem e
  data — e nunca como texto sobre claro (para texto, `ocre-escuro`). Azul para link e rótulo de
  categoria.
- **Elevação em 3 níveis** (`<Cartao nivel>`): plano, contorno, aplique. **No máximo UM aplique por
  tela**: sombra em tudo foi o principal motivo do ar amador do layout v1.
- **Uma faixa listrada por página**, e quem a desenha é o rodapé. Tela não desenha faixa.
- **Toda página abre com `<CabecalhoDaPagina>`**: sobretítulo (a seção do menu) → H1 → lead.
- **Texto em rem, nunca em px nem `vw`**: o A−/A/A+ muda o font-size da raiz. Exceção única e
  escrita: os rótulos da barra inferior param de crescer em 15px (cinco colunas em 320px).
- **Campos de 52px e fonte de 16px** (`<Campo>`) — abaixo disso o iOS dá zoom ao focar.
- **Alvo de toque mínimo de 44px.** CTA de 52px.
- **Navegação de uma fonte só:** `frontend/src/compartilhado/navegacao.ts` alimenta a barra
  inferior, o cabeçalho do desktop e o menu em folha.
- **Contato e acessibilidade moram no menu em folha.** Não há botão flutuante de WhatsApp nem barra
  fixa de acessibilidade — foi uma decisão da análise (camadas flutuantes sobre o conteúdo).
- **Datas sempre no fuso de São Paulo** (`compartilhado/datas.ts`), nunca no do aparelho.
- **Catálogo:** `/componentes` mostra cada componente base. Só existe em desenvolvimento
  (`npm run dev`); o build de produção não o inclui.

## Backlog: Épicos, User Stories e Tasks

Segue o Anexo I, seção 2.2.1, e a trilha de Metodologias Ágeis:

- **Épico** — objetivo amplo do produto, agrupa User Stories. São **9**, numerados de 1 a 9.
- **User Story** — "Como [perfil], quero [ação] para [benefício]", com **critérios de aceitação
  objetivos**. São **39**, identificadas **RF01 a RF39** (a numeração não segue a ordem dos
  Épicos: o RF38 está no Épico 1, por exemplo).
- **Task** — desdobramento técnico de uma User Story, criada pela equipe **durante o
  desenvolvimento** (issue no GitHub ligada ao RF). Não faz parte do documento de requisitos.

| Épico | User Stories |
|---|---|
| 1 — Site institucional e divulgação | RF01–RF07, RF38, RF39 |
| 2 — Cadastro de usuários e acesso | RF08–RF12 |
| 3 — Gerenciamento de eventos | RF13–RF18 |
| 4 — Gestão de doações | RF19–RF23 |
| 5 — Área de voluntariado | RF24–RF26 |
| 6 — Acervo aberto | RF35–RF37 |
| 7 — Comunicação interna | RF27–RF29 |
| 8 — Relatórios | RF30–RF32 |
| 9 — Administração | RF33, RF34 |

A fonte é `docs/originais/02_Documentacao_Tecnica/01_Requisitos/Documento_Requisitos.pdf` (e a
versão `.html` ao lado, mais fácil de ler). Quando o documento evoluir, a v2 vai para
`docs/01_Requisitos/`. Não criar User Story que não esteja lá sem registrar no Changelog.

## Fluxo de trabalho

- A migração acontece **por Pull Requests contra a `main`**, um assunto por PR.
- Título do PR com o RF quando houver: `[RF15] Inscrição em evento sem conta`.
- A ordem segue o Plano de Migração: F1 fundação visual → F2 estrutura → F4 páginas principais
  → F5 demais páginas → F6 biblioteca → F7 painel → F8 qualidade. A F3 (banco) anda em paralelo
  e destrava as telas que precisam de dado novo — o plano escreve as migrations 015–020 em SQL do
  Supabase; aqui elas viram migrations do Sequelize em `backend/src/database/migrations/`.
- O PR diz quais critérios de aceitação cobre e como foi verificado.
- Antes de abrir: `npm test` e `npm run typecheck` nas duas pastas.

## Arquitetura em uma tela

- **Back-end** (`backend/src`): `routes → middlewares → controllers → services → models`.
  Controller não tem regra de negócio; service não conhece `req`/`res`.
- **Erro em formato único**: `{ erro: { codigo, mensagem, detalhes? } }`, montado só em
  `middlewares/tratarErros.ts`. O Express 5 encaminha Promise rejeitada sozinho — sem try/catch
  repetido nas rotas. Erro inesperado nunca devolve mensagem interna.
- **Validação** em `middlewares/validar.ts` com Zod, para `body`, `query` e `params`. O que chega ao
  controller é a versão interpretada pelo esquema.
- **Autenticação** em `middlewares/autenticar.ts` (JWT Bearer, HS256 fixo). O token carrega só o
  `sub`; papéis são lidos do banco a cada requisição que precisar deles.
- **Variáveis de ambiente** validadas em `config/env.ts`: falta de segredo impede a API de subir.
- **Banco**: tabelas nascem por migration (`src/database/migrations/`, Umzug), nunca por `sync()`.
- **Swagger** em `src/docs/openapi.ts`: rota nova entra lá no mesmo PR.
- **Front-end** (`frontend/src`): rotas em `rotas.tsx`, uma instância Axios em `servicos/api.ts`,
  React Query para todo dado vindo da API, Tailwind com os tokens do design system em `estilos.css`.
  `componentes/ui/` são as peças (Botao, Campo, Cartao…); `componentes/estrutura/` é a moldura
  (Layout, LayoutFocado, Cabecalho, BarraInferior, Menu, Rodape).
- **Preferências de leitura** (A−/A/A+ e alto contraste) em Context API
  (`contextos/PreferenciasDeLeitura.tsx`), aplicadas como `data-fonte`/`data-contraste` no
  `<html>` e reaplicadas por um script em `index.html` antes da primeira pintura. Alto contraste é
  troca de token, não `filter`.
- **Menu em folha** é um `<dialog>` nativo com `showModal()`: o navegador prende o foco, fecha com
  Esc e devolve o foco a quem abriu. Não reimplementar isso à mão.
- **Troca de rota move o foco para o `<main>`** (`useFocoNaNavegacao`), comparando com o caminho
  anterior — uma trava de "primeira vez" quebra no StrictMode (medido, há teste).

## Status por módulo

Atualizado em 08/10/2026.

| Item | Status |
|---|---|
| Estrutura do repositório (Anexo I, 3.2) | **pronto** |
| `docs/originais/` | **pronto** — cópia do .zip da Submissão Institucional, conferida arquivo a arquivo com `diff` |
| Back-end base: Express, CORS, helmet, erro único, validação, JWT, bcrypt, Swagger | **pronto** — 22 testes Jest; `/api/saude` medido contra MySQL 8.4 real (200 com banco, 503 sem) |
| Migrations (Umzug) | **pronto** — `up`/`down` medidos contra MySQL real; nenhuma tabela ainda |
| Front-end base: Vite, React Router, React Query, Axios, Tailwind | **pronto** |
| Design system — fundação visual (F1): tokens, Bitter local, escala de tipo, 3 níveis de elevação, Botao, Campo, CampoSenha, CabecalhoDaPagina, ItemDeLista, Cartao, SeloDeData, Abas, FiltroEmChips, EstadoVazio | **pronto** — 35 testes Vitest; conferido no Chromium a 320, 390 e 1440px, com A+ no máximo e alto contraste: sem rolagem horizontal, nenhum alvo abaixo de 44px |
| Estrutura (F2): cabeçalho, barra inferior, menu em folha, rodapé, layout focado, link de pular, foco na troca de rota | **pronto** — Esc, retorno do foco e trava de rolagem medidos no Chromium. `BarraDeAcao` (F2.5) **falta**: entra com a primeira tela de detalhe |
| Páginas | **só a casca** — Início provisório e 404. Todos os links do menu levam ao 404 até cada tela ser migrada |
| Docker Compose (MySQL + API + front) | **escrito** — o MySQL subiu e foi usado; as imagens do back-end e do front não foram construídas neste ambiente (o `npm ci` dentro do container não alcança o registro do npm daqui) |
| Funcionalidades (RF01–RF39) | **falta** — migrar de `venturus-atelie`, um RF por PR |
| Deploy | **falta** |

## Pendências que dependem de gente

1. **Nome da equipe:** o .zip da submissão se chama `..._G3Z` e o repositório `...-g3x`. O
   RNF-REP-06 exige `fic2026-[fatec]-[equipe]` — se a equipe é G3Z, o repositório precisa ser
   renomeado.
2. Nomes e papéis da equipe no `README.md` e o revisor na tabela do `AGENTS.md`.
3. Decisões abertas do Plano de Migração: a Biblioteca entra na barra no lugar de Projetos? (hoje,
   provisoriamente, não — `navegacao.ts`); fotos de Wil e Nathy, da sede e do símbolo Sankofa, e
   com qual autorização; chave Pix real; listas fechadas de gêneros, temas e faixas etárias; quem
   produz o conteúdo da biblioteca.
4. Plataforma de deploy, que precisa de MySQL gerenciado (afeta o RNF10, custo).
5. Requisitos do projeto que a troca de stack afetou (RNF08, RNF09, RNF11, RNF12): ver o
   Changelog. A equipe decide como cada um fica na v2 do Documento de Requisitos.
