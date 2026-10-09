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
docker compose up --build                       # MySQL + API + front-end (o backend aplica as migrations ao subir)
docker compose exec backend npm run db:migrate:undo  # desfaz a última migration

cd backend  && npm test && npm run typecheck    # Jest + Supertest (sem banco)
cd backend  && npm run test:db                  # integração contra MySQL real (ver backend/README.md)
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
14. **Verificar olhando.** Teste verde não substitui abrir a tela. Neste repositório já aconteceu
    três vezes, e nas três os testes estavam verdes: o "Apoiar" no cabeçalho do celular e o foco
    roubado na carga (35 testes); a agenda com rolagem horizontal e a lista espremida em 40px no
    desktop (78 testes — o jsdom não aplica CSS, então não existe layout para ele medir); e os
    acentos gravados em dobro ("CafÃº") por um seed feito com o cliente `mysql` sem
    `--default-character-set=utf8mb4`. Abrir a tela no Chromium a 390 e 1440px não é opcional.

## Convenções de código

- **Código e nomes de arquivo em inglês**; interface, mensagens para quem usa o site e
  documentação (`docs/`, READMEs, este arquivo) em português. O regulamento não fixa idioma; a
  troca em relação ao RNF04 da submissão está no Changelog.
- **Comentário só quando é estritamente necessário**: o porquê que o código não consegue dizer
  (uma armadilha medida, uma restrição de plataforma). Nunca o quê — nome de função e de variável
  fazem esse trabalho. Explicação longa de decisão vai para este arquivo ou para o Changelog.
- **Commits no padrão Conventional Commits**: `tipo(escopo): descrição`, com tipos `feat`, `fix`,
  `docs`, `style`, `refactor`, `test`, `chore`, `build`, `ci` e escopos `backend`, `frontend`,
  `docs`. Descrição no imperativo, em inglês, sem ponto final. Sem trailers de coautoria.
- **Branches** `tipo/descricao-curta` (ex.: `feat/home-page`, `fix/menu-focus`), a partir da
  `main`. Sem prefixo de ferramenta (`claude/`, `copilot/`…).

## Regras do layout (Análise UX/UI)

Valem para toda tela nova. Os tokens estão em `frontend/src/styles.css` (bloco `@theme`).

- **Creme domina; marrom é texto e ação principal.** Ocre só em "Apoiar", estado ativo, contagem e
  data — e nunca como texto sobre claro (para texto, `ocre-escuro`). Azul para link e rótulo de
  categoria.
- **Elevação em 3 níveis** (`<Card elevation>`): `flat`, `outline`, `applique`. **No máximo UM aplique por
  tela**: sombra em tudo foi o principal motivo do ar amador do layout v1.
- **Uma faixa listrada por página**, e quem a desenha é o rodapé. Tela não desenha faixa.
- **Toda página abre com `<PageHeader>`**: sobretítulo (a seção do menu) → H1 → lead.
- **Texto em rem, nunca em px nem `vw`**: o A−/A/A+ muda o font-size da raiz. Exceção única e
  escrita: os rótulos da barra inferior param de crescer em 15px (cinco colunas em 320px).
- **Campos de 52px e fonte de 16px** (`<TextField>`) — abaixo disso o iOS dá zoom ao focar.
- **Alvo de toque mínimo de 44px.** CTA de 52px.
- **Navegação de uma fonte só:** `frontend/src/lib/navigation.ts` alimenta a barra
  inferior, o cabeçalho do desktop e o menu em folha.
- **Layout em grid no desktop: todo item que se sobrepõe a outro precisa de coluna E linha
  explícitas.** Com só `col-span-2` o navegador empurra o item para a coluna seguinte e cria uma
  coluna implícita (medido na agenda). E use `minmax(0, 1fr)`, não `1fr`, que não encolhe abaixo do
  conteúdo e faz a página rolar para o lado.
- **Texto escondido para leitor de tela (`sr-only`) leva o espaço FORA do `<span>`**
  (`Inscrever <span class="sr-only">em Banzo</span>`): dentro dele o espaço some e o nome sai
  "Inscreverem Banzo". Já aconteceu duas vezes.
- **Contato e acessibilidade moram no menu em folha.** Não há botão flutuante de WhatsApp nem barra
  fixa de acessibilidade — foi uma decisão da análise (camadas flutuantes sobre o conteúdo).
- **Datas sempre no fuso de São Paulo** (`lib/dates.ts`), nunca no do aparelho.
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

- A migração acontece **por Pull Requests contra a `main`**, um assunto por PR, numa branch
  `tipo/descricao-curta`.
- Título do PR em Conventional Commits, com o RF quando houver: `feat(frontend): RF15 event
  registration without account`.
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
  `middlewares/error-handler.ts`. O Express 5 encaminha Promise rejeitada sozinho — sem try/catch
  repetido nas rotas. Erro inesperado nunca devolve mensagem interna.
- **Validação** em `middlewares/validate.ts` com Zod, para `body`, `query` e `params`. O que chega ao
  controller é a versão interpretada pelo esquema.
- **Autenticação** em `middlewares/authenticate.ts` (JWT Bearer, HS256 fixo). O token carrega só o
  `sub`; papéis são lidos do banco a cada requisição que precisar deles.
- **Variáveis de ambiente** validadas em `config/env.ts`: falta de segredo impede a API de subir.
- **Banco**: tabelas nascem por migration (`src/database/migrations/`, Umzug), nunca por `sync()`.
  Teste que depende de SQL de verdade fica em `tests/integration/` — filtro de data com `NULL`,
  `CHECK` e acento só se provam contra o MySQL, e foi o que pegou o `NOT(...)` que derrubava os
  eventos sem horário de término do período "passado".
- **Eventos**: a API pública só devolve `published = true`; a tela nunca recebe rascunho.
  `period=upcoming` é `COALESCE(ends_at, starts_at) >= agora`, e `past` é o complemento escrito por
  extenso (não `NOT`). Horários guardados em UTC e exibidos no fuso de São Paulo.
- **Autenticação (RF08, RF10, RF12)**: `POST /api/auth/register|login`, `GET /api/auth/me`. O cadastro
  grava só colunas listadas à mão (`auth.service.ts`), com `is_staff` fixo em `false` — o esquema Zod
  descarta o resto, e há teste de integração com corpo hostil. A senha é bcrypt custo 12 (limite de
  72 *bytes*, validado). O login compara contra um hash fixo quando o e-mail não existe, para que o
  tempo de resposta não revele quem tem conta; a frase de credencial errada é a mesma nos dois casos.
  `409 email_taken` revela que o e-mail existe — troca aceita, porque sem ela a pessoa não sabe que
  deve entrar em vez de cadastrar. Maioridade e consentimento são gravados como data, não como booleano.
- **Painel da equipe (RF13)**: `/api/admin/*` passa por `authenticate` + `requireStaff`
  (`middlewares/require-staff.ts`), que **pergunta ao banco** se a conta é equipe a cada requisição —
  nunca lê o token (um `isStaff: true` escrito à mão no JWT dá 403, há teste) e perde o acesso na
  hora se a coluna voltar a `false`. Quem não é equipe recebe 403 na API e **404 na tela** (`RequireStaff`):
  o painel não anuncia que existe. Em eventos, **salvar nunca publica**: `published` não está no esquema
  Zod e também não está na lista de colunas do service (duas travas, cada uma com teste); só
  `PATCH /admin/events/:id/publication` o altera, e esse corpo aceita só `published`. **Não existe
  `DELETE`** (apagar levaria a lista de inscritos). Data e hora chegam como horário de parede
  (`2026-11-20T15:00`) e o **servidor** as lê no fuso de São Paulo (`utils/time-zone.ts`, por regras do
  `Intl` e não por um `-03:00` fixo — em 2018 o Brasil estava no horário de verão); o fuso do aparelho
  não entra.
- **Swagger** em `src/docs/openapi.ts`: rota nova entra lá no mesmo PR.
- **Front-end** (`frontend/src`): rotas em `routes.tsx`, uma instância Axios em `services/api.ts`,
  React Query para todo dado vindo da API, Tailwind com os tokens do design system em `styles.css`.
  `components/ui/` são as peças (Button, TextField, Card…); `components/layout/` é a moldura
  (Layout, FocusedLayout, Header, BottomBar, Menu, Footer).
- **Sessão** (duas peças, de propósito): o **token de acesso** (JWT, 1 h) vive só na memória do módulo
  (`services/session.ts`) — em `localStorage` qualquer script da página o leria. O que atravessa o
  recarregar é o **token de renovação**: valor aleatório de 32 bytes num cookie `httpOnly`, `SameSite=Lax`,
  `Path=/api/auth`, 7 dias (`utils/refresh-cookie.ts`), do qual o banco guarda só o SHA-256
  (`refresh_tokens`). Ao abrir a página, `AuthProvider` chama `POST /auth/refresh` e recebe de volta o
  usuário e um token de acesso novo; quando o token de acesso vence no meio do uso, o interceptor do
  Axios renova **uma vez** e repete a requisição. Regras que não são dedutíveis:
  - **o cookie gira a cada uso** (rotação). Dois usos paralelos gastariam o mesmo cookie, então a
    renovação é de **uma requisição por vez** no front (`refreshSession`, medido sob StrictMode) e o
    back-end tolera 10 s de reuso do cookie recém-trocado (duas abas abertas juntas). Passados os 10 s,
    reuso de cookie já trocado é tratado como vazamento: **todas as sessões da conta são apagadas**
    (apagadas, e não marcadas como revogadas — revogada ainda passaria dentro da tolerância; um teste de
    integração pegou isso);
  - **sair apaga a linha** do cookie (também sem tolerância) e o cookie do navegador;
  - **`X-Requested-With` é obrigatório** em `/auth/refresh` e `/auth/logout`: cruzando sites, o cabeçalho
    só passa por um preflight de CORS, que só as origens liberadas vencem. Reforça o `SameSite`;
  - **`af-session` no `localStorage` é só uma dica** ("vale a pena pedir sessão ao abrir"), sem segredo.
    Sem ela o visitante não faz requisição nenhuma e não vê `401` no console. Resposta do servidor
    recusando o cookie → "sua sessão terminou"; **sem resposta (rede) a dica fica** e a página não
    afirma que a sessão acabou;
  - **domínios diferentes entre site e API** pedem `COOKIE_SAMESITE=none` (o cookie passa a `Secure`);
  - 401 de senha errada não é sessão expirada: `/auth/login` e `/auth/register` não disparam renovação.
  `RequireAuth` espera a restauração terminar antes de decidir (sem isso um recarregar em `/minha-conta`
  cairia em `/entrar`), e manda quem não entrou para `/entrar?voltar=<caminho>`; o destino passa por
  `safeRedirect`, uma lista de caracteres permitidos.
  Sair navega para `/` **com `flushSync` antes** de limpar a sessão: do contrário a página protegida
  ainda montada redireciona para `/entrar` (medido no navegador; o jsdom não mostra).
- **Preferências de leitura** (A−/A/A+ e alto contraste) em Context API
  (`contexts/ReadingPreferencesProvider.tsx`), aplicadas como `data-font-scale`/`data-contrast` no
  `<html>` e reaplicadas por um script em `index.html` antes da primeira pintura. Alto contraste é
  troca de token, não `filter` — o filtro deixaria as fotos cinzas sem aumentar o contraste do texto.
- **Menu em folha** é um `<dialog>` nativo com `showModal()`: o navegador prende o foco, fecha com
  Esc e devolve o foco a quem abriu. Não reimplementar isso à mão.
- **Troca de rota move o foco para o `<main>`** (`useRouteFocus`), comparando com o caminho
  anterior — uma trava de "primeira vez" quebra no StrictMode (medido, há teste).

## Status por módulo

Atualizado em 09/10/2026.

| Item | Status |
|---|---|
| Estrutura do repositório (Anexo I, 3.2) | **pronto** |
| `docs/originais/` | **pronto** — cópia do .zip da Submissão Institucional, conferida arquivo a arquivo com `diff` |
| Back-end base: Express, CORS, helmet, erro único, validação, JWT, bcrypt, Swagger | **pronto** — 22 testes Jest; `/api/health` medido contra MySQL 8.4 real (200 com banco, 503 sem) |
| Migrations (Umzug) | **pronto** — `up`/`down` medidos contra MySQL real; tabelas `events` (com `requires_cpf`), `users` e `refresh_tokens` |
| Front-end base: Vite, React Router, React Query, Axios, Tailwind | **pronto** |
| Design system — fundação visual (F1): tokens, Bitter local, escala de tipo, 3 níveis de elevação, Button (com estado "Enviando…"), TextField, PasswordField, PageHeader, ListItem, Card, DateBadge, Tabs, ChipFilter, EmptyState, BackLink, ActionBar, aviso fixo (toast) com ação | **pronto** — 49 testes Vitest; conferido no Chromium a 320, 390 e 1440px, com A+ no máximo e alto contraste: sem rolagem horizontal, nenhum alvo abaixo de 44px |
| Estrutura (F2): cabeçalho, barra inferior, menu em folha (com a barra visível por baixo, como na 3a), rodapé, layout focado, link de pular, foco e fade de 150ms na troca de rota | **pronto** — Esc, retorno do foco e trava de rolagem medidos no Chromium. Uma rota pode trocar a barra inferior pela barra de ação com `handle: { hideBottomBar: true }` (usado pelo formulário de evento) |
| Home (RF01, tarefa 4.1) | **pronta**: herói, "Por onde começar", "O que fazemos" e escolas conferidos lado a lado com as telas 2a e 6a, e "Próxima atividade" ligada à API de eventos (conferida no navegador com evento real; sem evento publicado ou com a API fora do ar, o bloco não aparece) |
| Agenda (RF14, tarefa 4.2) | **pronta, com 4 diferenças do desenho listadas abaixo**: `/agenda` com abas Em breve / Já aconteceu, filtro por tipo (chips no celular, coluna no desktop), próximo evento em destaque, "+ Agenda" (`.ics`) e estados vazio, carregando e falha. Conferida no Chromium contra o backend e o MySQL reais, a 320, 390, 1024 e 1440px, com A+ no máximo e alto contraste. Backend: `GET /api/events` e `GET /api/events/:id/calendar.ics`, 39 testes unitários + 7 de integração |
| Cadastro e edição de eventos (RF13) | **pronto**: `/admin` (home do painel), `/admin/eventos` (rascunhos e publicados em seções, "Publicar"/"Tirar do ar" com "Desfazer" no aviso), `/admin/eventos/novo` e `/admin/eventos/:id/editar` (título, tipo, início e término, local, faixa etária, **limite de vagas e exigência de CPF, os dois opcionais**, descrição). Backend: 47 testes unitários + 12 de integração contra MySQL real (403 para quem não é equipe, promoção e rebaixamento valendo na requisição seguinte, rascunho invisível na agenda pública, publicar/tirar do ar, horário de São Paulo gravado como UTC, acento e emoji, sem DELETE). Frontend: 21 testes. **Conferido no Chromium contra a API e o MySQL reais** (390, 320 com A+ e alto contraste, 1440): conta comum vê o 404, equipe cria um rascunho, a agenda pública **não** o mostra, publicar o faz aparecer com "15h–17h", editar mantém publicado, tirar do ar o remove; sem rolagem lateral e sem alvo abaixo de 44px. **Falta:** a **foto** do evento (não há upload nem autorização de imagem) e a **lista fechada de tipos** (hoje texto livre, com a dica "escreva sempre do mesmo jeito"). Ninguém é equipe sem SQL (`update users set is_staff = true where email = '…'`) |
| Cadastro e login (RF08, RF09, RF10, RF12) | **prontos, com RF10 parcial**: `/entrar` (abas Entrar / Criar conta), `/minha-conta` (só a ficha, leitura), cabeçalho com o primeiro nome + "Sair", bloco "Sua conta" no menu. **A sessão sobrevive ao recarregar** (cookie de renovação `httpOnly` + token de acesso em memória; ver Arquitetura). Backend: 63 testes unitários de auth/sessão + 25 de integração (corpo hostil, cadastro simultâneo → 201 + 409, hash gravado, rotação, reuso, logout, conta apagada). Conferido no Chromium contra a API e o MySQL reais a 320, 390 e 1440px, com A+ e alto contraste: sem rolagem lateral, nenhum alvo abaixo de 44px, o script da página só enxerga `af-session=1` (cookie `httpOnly` invisível, token fora de storage), recarregar mantém a sessão, duas abas recarregando juntas ficam as duas logadas, token de acesso vencido é renovado sem a pessoa notar (`401` → `refresh` → repete), sair apaga o cookie e recarregar não restaura, `is_staff` continua 0 com corpo hostil. **Ainda não medido:** `COOKIE_SAMESITE=none` entre domínios de verdade, e HTTPS (`Secure`) — só há `localhost`. **Falta: recuperar senha** (exige envio de e-mail, que depende de escolher o provedor) |
| Contas — o que ainda falta | RF11 só tem a ficha (sem editar dados nem candidaturas e doações, que não existem). **Ninguém é equipe ainda**: só por SQL. **Sem limite de tentativas de login** — adiado de propósito: sem saber a topologia do deploy (proxy confiável), um limite por IP trancaria uma escola inteira atrás do mesmo IP. O texto do "lead" de `/entrar` não promete candidatura nem doação, que ainda não existem |
| Páginas | Home, agenda, entrar, minha conta, painel (`/admin`, eventos), 404 e catálogo. Os outros links do menu levam ao 404 até cada tela ser migrada |
| Docker Compose (MySQL + API + front) | **escrito** — o MySQL subiu e foi usado; as imagens do back-end e do front não foram construídas neste ambiente (o `npm ci` dentro do container não alcança o registro do npm daqui) |
| Funcionalidades (RF01–RF39) | **falta** — migrar de `venturus-atelie`, um RF por PR |
| Deploy | **falta** |

## Pendências que dependem de gente

1. **Nome da equipe:** o .zip da submissão se chama `..._G3Z` e o repositório `...-g3x`. O
   RNF-REP-06 exige `fic2026-[fatec]-[equipe]` — se a equipe é G3Z, o repositório precisa ser
   renomeado.
2. Nomes e papéis da equipe no `README.md` e o revisor na tabela do `AGENTS.md`.
3. Decisões abertas do Plano de Migração: a Biblioteca entra na barra no lugar de Projetos? (hoje,
   provisoriamente, não — `lib/navigation.ts`); fotos de Wil e Nathy, da sede e do símbolo Sankofa, e
   com qual autorização; chave Pix real; listas fechadas de gêneros, temas e faixas etárias; quem
   produz o conteúdo da biblioteca.
4. Plataforma de deploy, que precisa de MySQL gerenciado (afeta o RNF10, custo).
5. **Agenda — o que o desenho tem e o código ainda não:**
   - **foto no destaque do próximo evento** (6b): não há upload de imagem nem coluna para ela;
   - **"Ver detalhes"** no lugar de "Inscrever" em alguns eventos: não há página de detalhe nem
     critério para quando um evento não aceita inscrição;
   - **tipo do evento (Contação, Apresentação, Oficina)**: o Plano de Migração (F3.1/F3.2) liga o
     tipo ao gênero da atividade, numa lista fechada que a ONG ainda não definiu. Hoje é o texto
     livre `events.category`, e os chips nascem do que existir — texto livre gera chips repetidos
     ("Contação" × "Contação de história") se a equipe digitar de dois jeitos;
   - **"N vagas" é a capacidade, não as vagas restantes**: não há tabela de inscrições. Quando o
     RF15 existir, o service passa a descontar as inscrições — e o texto precisa dizer "restantes".
6. **"Quero me inscrever" leva a `/agenda/:id/inscricao`, que ainda não existe (RF15)**: a pessoa
   cai no 404. Vale o mesmo para "Ver como funciona" e "Ler nossa história completa".
5. Requisitos do projeto que a troca de stack afetou (RNF08, RNF09, RNF11, RNF12): ver o
   Changelog. A equipe decide como cada um fica na v2 do Documento de Requisitos.
