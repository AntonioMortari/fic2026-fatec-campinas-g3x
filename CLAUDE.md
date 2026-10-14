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
docker compose up --build                       # MySQL + API + front-end (o backend aplica as migrations e a seed ao subir)
docker compose exec backend npm run db:migrate:undo  # desfaz a última migration

cd backend  && npm test && npm run typecheck    # Jest + Supertest (sem banco)
cd backend  && npm run test:db                  # integração contra MySQL real (ver backend/README.md)
cd backend  && npm run db:seed                  # contas de teste: admin@atelie.local (equipe) e usuario@atelie.local, senha senha-dev-123
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
- **Erro é vermelho, e só erro é vermelho** (`--color-error` tijolo `#A52A1E`, `--color-error-tint` `#FBE9E4`;
  em alto contraste `#8A0000` sobre branco). O vermelho nunca vem sozinho: sempre com **texto e ícone**
  (`ErrorIcon`), porque a cor não basta. Nenhuma tela escreve a cor de erro à mão — usa o componente:
  campo com erro = `error="…"` em `TextField`/`SelectField`/`TextAreaField`/`Checkbox` (borda de 2px e
  mensagem vermelha por `FieldMessages`); aviso do formulário = `<Alert tone="error">`; falha de carga =
  `<EmptyState tone="error">`; aviso fixo = `toast(msg, { tone: 'error' })`. Mensagem de erro que não é de
  campo (ex.: "escolha ao menos uma forma de participar") também passa por `FieldMessages`. Um teste
  confere o contraste (4,5:1 sobre creme, cartão e fundo do aviso, nos dois modos) e que a cor é um
  vermelho — não ocre, que é luz, data e ação. **Armadilha medida:** a borda do campo não pode ser
  `FIELD_BOX` + `border-error` por cima — duas utilidades de cor de borda no mesmo elemento são decididas
  pela ordem em que o Tailwind as emite, e o erro perdia (campo continuava cinza). `fieldBox(invalid)` troca
  o conjunto inteiro.
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

- **Hover é padrão, e mora em três lugares** (nunca em cada tela): `styles.css` dá a **toda** `a`, `button`, `summary` e `[role=tab]` a mesma transição de 150ms, o cursor de mão e um escurecimento de 4% nos botões; o token `--color-hover` (creme-escuro; cinza no alto contraste, onde `cream-dark` virou branco e o hover sumiria) é o fundo de quem é transparente; e `Button` tem uma resposta por variante — `primary` clareia e sobe 1px, `applique` sobe 2px e a sombra cresce (a sombra fica no lugar, o botão é que se mexe), `secondary` ganha o fundo de hover, `support` escurece. **Link de menu troca de cor para azul** (`hover:text-blue-deep`), item de lista ganha o fundo e a seta anda 4px, e link do cabeçalho desenha a barrinha por baixo. As respostas de `Button` são `not-disabled:hover:` — botão desligado ou carregando não reage. Tela nova usa `Button`/`ListItem` e herda; `button` solto ganha ao menos o padrão do `styles.css`. **O toque (`:active`) fecha em 90ms**, como pede a seção "Movimento" do desenho: o hover usa 150ms e o aperto 90ms, e quem decide é o estado de destino da transição. `prefers-reduced-motion` zera as durações.
- **Movimento: significa algo (orientação, feedback, continuidade) ou não existe.** Nada de quique,
  parallax, laço decorativo ou duração longa. **Durações e curva são tokens** no `@theme` de
  `styles.css` (`--motion-press` 90ms, `--motion-micro` e `--motion-page` 150ms, `--motion-enter` 200ms,
  `--motion-menu` 180ms, `--motion-sheet` 280ms e `--motion-sheet-out` 200ms, `--ease-out-soft`); nenhuma
  tela escreve milissegundo à mão, e `design-tokens.test.ts` trava os números do desenho. Transição de
  página ≤ ~250ms, microfeedback ≤ 150ms, e **nada bloqueia o toque**. **`prefers-reduced-motion` zera tudo
  num lugar só** (bloco no fim de `styles.css`: duração, atraso do `enter-list` e `scroll-behavior`), e o que
  é JS passa por `lib/motion.ts` (`scrollBehavior()` devolve `auto` para quem pediu menos). Onde cada padrão
  mora: **carregando** = `LoadingState`/`Skeleton` (`components/ui/Skeleton.tsx`), que só aparece depois de
  120ms (resposta rápida nunca pisca), reserva a altura do que vem (CLS) e é lido como "Carregando…" — o
  desenho é `aria-hidden`; passe `children` para reservar o tamanho exato de uma página. **Entrada de lista** =
  a classe `enter-list` no contêiner (cada filho sobe 8px + fade em 200ms, escalonado em 20ms e travado no
  4º item, uma vez só, sem JS); lista que troca de filtro leva `key` para repetir. **Rolagem** = nunca
  `scrollTo(0, 0)` solto: `scrollToTop()` (instantâneo, troca de rota), `scrollToStart()` (suave, dentro da
  página) e `focusAndReveal()`/`revealElement()` (foco com `preventScroll` + rolagem nossa, que respeita o
  `scroll-mt`/`scroll-mb` do elemento). `useFormFeedback` já leva ao primeiro campo com erro, e o grupo do
  responsável (menor de idade) rola até aparecer. `useRouteFocus` foca o `<main>` **sem** pular a página e
  **restaura a posição no "voltar"** (retoma por até 600ms enquanto a página enche). Âncoras
  (`#id`) rolam suave por `html { scroll-behavior }`, só quando há permissão de movimento. **Saídas**: folhas
  do menu (`dialog[data-sheet]`) e o fundo escurecido saem por CSS puro (`@starting-style` + `allow-discrete`),
  o aviso fixo afunda 150ms antes de sair (`TOAST_EXIT_MS`), e `<details>` abre e fecha a altura
  (`::details-content`, só onde o navegador sabe). **Botão enviando** guarda a largura do rótulo e ganha um
  anel de 800ms — o único laço permitido, porque é estado de carga; o esqueleto também pulsa, devagar, pelo
  mesmo motivo. Tela nova usa isso e herda. **Não há saída de página**: atrasar a navegação para esmaecer a
  tela que sai custa o tempo da pessoa; o que dá continuidade é o cabeçalho e a barra fixos mais a entrada de
  150ms.

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
- **Tela sem desenho no Claude Design não se inventa**: antes de começar uma tela, confere-se se ela existe
  nos desenhos (Análise UX/UI e "Telas Conta e Relatório", rodada 7). Se não existe, para-se e avisa-se quem
  desenha, com a lista do que a tela precisa mostrar. Quando o desenho tem item para uma tela que ainda não
  existe (ex.: "Atividades", "Pessoas" no menu lateral), o item **não entra** — um link para o 404 é pior que
  a ausência.
- O PR diz quais critérios de aceitação cobre e como foi verificado.
- **O CI (`.github/workflows/ci.yml`) roda em todo PR e em todo push na `main`**, em três jobs paralelos: `frontend` (lint com oxlint, typecheck, testes e build), `backend` (typecheck e testes unitários) e `backend-integration` (`npm run test:db` contra um MySQL 8.4 de verdade, criado como serviço do job). O `backend/` ainda não tem linter, então não há lint de back-end. Rode os mesmos comandos antes de abrir o PR.
- **Todo PR leva o endereço do card do Trello** (`https://trello.com/c/xxxxxxxx`, o endereço puro, no título, no corpo ou no nome da branch). O workflow `.github/workflows/trello.yml` lê esses endereços e, ao **abrir** o PR, anexa o PR ao card e o move de "A fazer"/"Fazendo" para **"Em revisão"** (PR em rascunho só anexa); ao **mesclar**, move para "Feito"; ao **fechar sem mesclar**, devolve de "Em revisão" para "Fazendo". Nunca arrasta para trás um card que já está em "Feito". Precisa dos segredos `TRELLO_KEY` e `TRELLO_TOKEN` no repositório (Settings → Secrets and variables → Actions) e de uma lista chamada exatamente "Em revisão" no quadro; sem os segredos o workflow não faz nada e não falha. O quadro vem da variável `TRELLO_BOARD` (padrão `0PhAQ03T`). Os testes do script rodam no próprio workflow (`node --test .github/scripts/trello-sync.test.mjs`).
- Antes de abrir: `npm test` e `npm run typecheck` nas duas pastas.
- **Conformidade com o Regulamento Técnico, em TODO PR.** Antes de abrir (e de novo na entrega), rodar
  `/regulamento` (`.claude/skills/regulamento/SKILL.md`): ele confere stack, estrutura, `docs/originais/`,
  RNFs de segurança, qualidade, back-end, front-end, repositório, gerência de mudanças, deploy,
  acessibilidade e as regras de autoria e de IA (seções 11.1 e 11.2), rodando os comandos em vez de
  responder de memória. O resumo vai no corpo do PR (`.github/pull_request_template.md`). Divergência
  que o PR não resolve é dita ao usuário, nunca omitida. `.github/` e `.claude/` são configuração, não
  pastas do projeto: não contam para a regra de "nada novo na raiz".

## Arquitetura em uma tela

- **Back-end** (`backend/src`): `routes → middlewares → controllers → services → models`.
  Controller não tem regra de negócio; service não conhece `req`/`res`.
- **Erro em formato único**: `{ erro: { codigo, mensagem, detalhes? } }`, montado só em
  `middlewares/error-handler.ts`. O Express 5 encaminha Promise rejeitada sozinho — sem try/catch
  repetido nas rotas. Erro inesperado nunca devolve mensagem interna.
- **Validação** em `middlewares/validate.ts` com Zod, para `body`, `query` e `params`. O que chega ao
  controller é a versão interpretada pelo esquema. **Os esquemas moram em `validators/<módulo>.validator.ts`**
  (um arquivo por módulo, nunca um só para a aplicação; os campos que mais de um módulo usa — nome, telefone e
  tipo de pessoa — ficam em `validators/fields.validator.ts`). A rota importa o esquema e o passa ao `validate`;
  o controller só importa o **tipo** (`import type`) para tipar o que já chega validado. Esquema Zod dentro do
  controller não entra.
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
- **Painel (RF13)**: `/api/admin/*` passa por `authenticate` + `requireStaff`
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
- **Inscrição em evento (RF15), com ou sem conta**: `POST /api/events/:id/registrations`, aberta. Sem token
  é um visitante; com `Authorization` a inscrição fica ligada à conta **do token verificado** (`user_id`,
  nunca lido do corpo), e **um token ruim responde 401** em vez de virar visitante — o cliente renova e
  repete, e a inscrição não perde o vínculo por ter demorado preenchendo (`optionalAuthenticate`).
  A vaga é conferida **dentro de uma transação, com a linha do evento travada** (`SELECT … FOR UPDATE`):
  sem a trava, cinco pessoas para a última vaga entravam as cinco (medido contra o MySQL; o teste de
  concorrência falha sem ela). O CPF é pedido **se o evento pede** (`requires_cpf`, lido do banco) e,
  quando o evento não pede, um CPF que vier no corpo **não é gravado** (coleta mínima); os onze dígitos
  iguais são recusados à parte (passam na conta do módulo 11). Menor de idade exige nome e telefone do
  responsável (RN02) — no esquema Zod **e** num `CHECK` do banco; para adulto o responsável é descartado.
  Autorização de imagem é opcional (RN07), consentimento é obrigatório e gravado como data. Contra abuso:
  a mesma pessoa não se inscreve duas vezes (índice único em evento + e-mail + nome, com collation que
  ignora caixa e acento) e cada e-mail inscreve até 5 pessoas por evento (um responsável com vários filhos
  cabe; cem inscrições, não). Além disso, **30 inscrições por hora por conexão** (veja "Limite por conexão" abaixo). `registrations`
  usa `ON DELETE RESTRICT` para o evento (a lista de inscritos é registro: evento com inscrição não
  se apaga nem por SQL descuidado) e `SET NULL` para a conta (apagar a conta não leva a inscrição).
  A API pública devolve só `spotsLeft`, nunca quem se inscreveu.
- **Limite por conexão nas inscrições** (`utils/origin.ts`): a origem é o IP que o Express enxerga com
  `trust proxy` = `TRUST_PROXY` (saltos de proxy; padrão `0`), normalizado (`::ffff:a.b.c.d` vira IPv4; IPv6
  vira o prefixo /64, porque cada casa recebe um /64 inteiro e contar por endereço seria contar por nada).
  **O IP nunca é gravado**: vai para `registrations.origin_hash` o HMAC-SHA256 dele com a chave `JWT_SECRET`
  (sem a chave, um hash simples de IPv4 se inverte em minutos). Acima de 30 inscrições na última hora
  vindas da mesma origem, `429 too_many_requests` — o número cabe uma turma de escola saindo por um IP só.
  **`TRUST_PROXY` precisa ser conferido no primeiro deploy**: com `0` atrás de um proxy todo visitante
  parece ter o IP do proxy e o limite vira um balde único para o site inteiro (negação de serviço contra
  quem usa); alto demais, o `X-Forwarded-For` é forjável e o limite some. A API avisa uma vez no log se
  chega `X-Forwarded-For` com `TRUST_PROXY=0`. O limite de **login** continua adiado e pode reaproveitar
  `originHash`.
- **Inscritos (RF16)**: `GET /api/admin/events/:id/registrations` e `.csv`, só equipe, `no-store`, **só
  leitura** (não há como corrigir nem apagar — registro). A resposta não traz `user_id` nem `origin_hash`.
  A planilha usa `;` (o Excel em português lê vírgula como decimal), BOM UTF-8, CRLF e **neutraliza
  fórmula** (`= + - @`, tab e CR ganham um `'` na frente — as aspas não protegem disso); a coluna
  "Autorizou imagem" vem **antes** das de contato (RN07: o que está à direita numa planilha larga é o que
  ninguém rola para ver). O nome do arquivo sai do título do evento via `Content-Disposition`, exposto no CORS.
- **Presença (RF17)**: `GET /api/admin/events/:id/attendance` e `PATCH …/attendance/:registrationId`, só
  equipe. **Três estados, não dois**: `registrations.attended` é `NULL` (ninguém conferiu), `1` (veio) ou `0`
  (não veio) — uma lista não conferida não pode virar lista de faltas num relatório. A lista de presença
  é uma rota à parte da de inscritos **de propósito**: devolve só `id`, nome, menor de idade, a marca e, **só para menor, o telefone do responsável mascarado**
  (`guardianPhoneHint`, `(11) 9····-1234`), sem e-mail nem CPF (minimização no servidor, e a consulta pede só
  as colunas que usa), porque o celular fica virado para uma fila. O `PATCH` grava **uma coluna** e procura a inscrição por `id` **e** evento (id
  de outro evento é 404). `null` desmarca. No front a marca aparece na hora e volta se o servidor recusar
  (React Query otimista).
- **Minhas inscrições (RF11)**: `GET /api/me/registrations`, só com sessão. O filtro por `user_id` do token
  fica **no service** (regra 4: sem RLS), e há teste com duas contas. Só aparecem as inscrições feitas com a
  conta aberta (visitante não tem dono — a tela diz isso). A resposta traz `attendanceRecorded`, verdadeiro
  só quando a equipe marcou "veio": **"não veio" e "ninguém conferiu" saem iguais**, porque a falta é
  anotação de trabalho da equipe e não pode chegar à pessoa como acusação.
- **Cancelar inscrição (RF15, desenhos 7c/7d)**: `GET`/`POST /api/registrations/cancel/:code`, **abertas, sem
  sessão** — quem se inscreveu sem conta também precisa poder desistir. A prova é o link pessoal: `cancel_code`
  (UUID aleatório, único, entregue só a quem se inscreveu na resposta do `POST` da inscrição). A resposta pública
  traz o evento e o **nome abreviado** ("Ana S."), nunca contato, CPF ou responsável. **Cancelar é marcar
  `cancelled_at`, não apagar**: a linha continua como registro e some de tudo que conta — vagas, lista da
  equipe, presença, planilha, contagem do painel e "Minhas inscrições". Duas decisões que não são dedutíveis:
  (1) o índice único (evento, e-mail, nome) ganhou a coluna gerada `active_key` (1 enquanto viva, `NULL` depois
  de cancelada — o MySQL deixa `NULL` repetir), senão quem cancelou **não poderia se inscrever de novo**, que é
  o que a tela promete; (2) o limite por conexão **continua contando as canceladas** (foram envios), o de
  e-mail não. Cancelar duas vezes é `409 already_cancelled`, depois da atividade é `409 registrations_closed`, e
  dois toques ao mesmo tempo cancelam uma vez (linha travada). A migration 20261009160000 cria o índice novo
  **antes** de apagar o velho: o `FOREIGN KEY` de `event_id` precisa de um índice que comece por ele.
- **Alterar meus dados (RF11, desenho 7b)**: `PATCH /api/me`, só com sessão, grava **três colunas escritas à
  mão** (`name`, `phone`, `personType`) na conta **do token** — o `id` nunca vem do corpo nem da URL. E-mail,
  senha, papéis e preferências **não mudam por aqui**, seja qual for o corpo (regra 13): o esquema Zod os
  descarta **e** o service só lista as três colunas — duas travas, e a segunda é redundante de propósito
  (afrouxar o Zod não derruba teste, e é aceito). Trocar o e-mail pediria confirmação por e-mail (RF18), que
  não existe; a tela diz isso e aponta o WhatsApp. O telefone a um dígito de valer responde a frase do
  desenho ("Falta um dígito. Exemplo: (11) 98765-4321."); as demais, a de sempre. Depois de salvar, o
  `AuthProvider` recebe o usuário novo (`updateUser`) e o nome do cabeçalho muda no mesmo gesto.
- **Contato (RF07), formulário público sem sessão**: `POST /api/contacts`, aberto como a inscrição em evento. Não
  tem `authenticate` **de propósito** (quem escreve para a ONG não tem conta) e por isso a validação Zod é a única
  barreira antes de uma tabela com dado pessoal: os campos são lidos por nome (`name`, `email`, `phone`, `institution`,
  `message`, `consent`), o resto do corpo é descartado e o service grava só as colunas escritas à mão — duas travas, e
  o teste de mutação só derruba com as duas removidas. **A resposta é só `{ "received": true }`**: não devolve a linha
  nem dado nenhum (a tela não precisa de nada, e um endpoint aberto que ecoa o que recebe é um jeito de ler o que
  outros mandaram). O consentimento é obrigatório (`z.literal(true)`, o texto do desenho não promete nada que a ONG não
  tenha dito) e gravado como **data** (`contacts.consented_at`), nunca como booleano. O telefone reaproveita
  `phoneField` de `validators/fields.validator.ts` (a mesma frase do "falta um dígito" de `/minha-conta/dados`). O limite é **30
  mensagens por hora por conexão** (`utils/origin.ts`, o mesmo HMAC do IP das inscrições; o IP nunca é gravado): cabe
  uma turma de escola saindo por um IP só e ainda barra um script. Mensagem recusada pela validação **não gasta** o
  limite. **Não existe leitura, listagem nem apagar**: a fila de atendimento da equipe é o RF29, outro card. Mesma
  advertência de `TRUST_PROXY` das inscrições: com `0` atrás de proxy o limite vira um balde único para o site inteiro.
- **Relatório (RF30–RF32, desenhos 7i e 7j)**: `GET /api/admin/report` e `/report/csv`, só equipe, só números
  (nenhum nome, e-mail ou documento). A janela é de **1, 3 ou 6 meses terminando no mês atual** (`offset` 0, -1,
  -2…), com os meses fechados à **meia-noite de São Paulo** (`utils/report-period.ts`; `to` é exclusivo, e há
  teste com a atividade no primeiro instante e um milissegundo antes). "Atividades realizadas" são as publicadas
  que já acabaram dentro da janela; **todo outro número conta as inscrições delas, sem as canceladas**. Veio /
  faltou / sem conferir somam as inscrições — quem ninguém marcou **não é falta** e a barra o desenha
  hachurado. **Contagem que falhou é `null` e a tela mostra traço, nunca zero**: as duas leituras (atividades,
  inscrições) falham separadas, e o total da lista vira traço se uma linha não pôde ser contada. A tabela traz as
  5 atividades mais recentes ("5 mais recentes de 14"); os totais de cima e a planilha cobrem todas. A planilha
  tem uma linha de total e traço onde a contagem falhou. No front, o desktop desenha tabela e o celular desenha
  lista (`useMediaQuery`); o PDF é `window.print()` com `print:hidden` no cabeçalho, no menu lateral e nos
  botões — **sem biblioteca de PDF**. Duas armadilhas medidas: sem `print-color-adjust: exact` o navegador
  descarta os fundos no papel e as barras saem vazias; e com o menu lateral escondido na impressão o conteúdo
  caía na coluna de 15rem (a grade vira bloco na impressão).
- **Seed de desenvolvimento** (`database/seed.ts`): duas contas com senha escrita no repositório — uma
  equipe, uma comum —, criadas pelo `docker compose up` e por `npm run db:seed`. **É a única forma de
  conceder `is_staff` sem SQL à mão, e por isso se recusa a rodar** com `NODE_ENV=production` **e** com
  `DB_HOST` fora de `localhost`, `127.0.0.1`, `::1` e `db` (quem tem `NODE_ENV=development` e o host de
  produção no `.env` também é barrado; os dois testes têm mutação). Idempotente: atualiza por e-mail e
  devolve senha e papéis ao combinado. Os e-mails são `.local` — passam na validação do login e não existem
  na internet, então nenhuma pessoa real é tocada. Não cria evento nem conteúdo (regra 8).
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
- **O painel tem moldura própria e o padrão das rodadas 9 e 10** (desenhos 9a–9c no desktop, 10a–10e no celular):
  `RequireStaff` entrega `AdminLayout` à equipe e entrega a quem não é equipe o **404 dentro da moldura pública**
  (`<Layout>` aceita `children`), para que o painel não se anuncie. **Cabeçalho creme nos dois tamanhos**: logotipo e selo
  "PAINEL"; no desktop (≥ 64rem) também o nome de quem entrou e "Ver o site". **Desktop**: menu lateral de 15rem com
  grupos (`AGENDA`, `GESTÃO`) e o item atual marcado por fundo e barra ocre. **Celular**: barra inferior creme (Início,
  Agenda, Mais) e **"Mais" é uma folha própria, "Painel"** (`AdminMenu`): as telas que a barra não mostra, "Minha conta",
  os controles de leitura, "Ver o site" e "Sair" — **não é mais o menu público**. `lib/admin-navigation.ts` é a fonte
  única do menu lateral e da folha, e **só lista telas que existem**. Toda tela do painel começa em `AdminPage` (16px no
  celular, 48px do menu lateral no desktop) e, quando é lista ou formulário, em `AdminTitle` (título à esquerda, a única
  ação secundária à direita). Uma rota pode esconder o cabeçalho **só no celular** com `handle: { hideHeaderOnMobile: true }`
  (a lista de presença, o relatório e o formulário de evento trazem o próprio topo).
- **Voluntariado (RF24, RF25, RF26)**: três tabelas por migration (`volunteer_areas`, com as 5 áreas reais semeadas
  pela própria migration e `id` em slug; `volunteer_applications`; `volunteer_application_areas`). `POST
  /api/volunteer-applications` exige sessão e grava **candidatura + áreas numa transação só** (sem estado parcial,
  ao contrário do projeto de origem, que tinha duas tabelas sem transação); o `user_id` vem do token e as colunas
  escritas são `userId`, `status: 'new'` e `message`. **Quem tem candidatura viva (`new`, `in_contact`,
  `volunteering`) não manda outra, e a regra mora também no banco**: coluna gerada `active_key` (1 enquanto viva,
  `NULL` em `ended`) com índice único `(user_id, active_key)`, o mesmo desenho de `registrations.active_key`; o
  service confere antes (409 `already_applied` rápido) e o `UniqueConstraintError` cobre dois envios simultâneos
  (teste de integração: 8 envios ao mesmo tempo → 1 candidatura). `ended` devolve o direito de se candidatar de
  novo, e a linha antiga fica como registro. Áreas repetidas no corpo são reduzidas a uma; área inexistente é 400 no
  campo `areas`. **Dois vocabulários de situação, de propósito**: a equipe lê "Nova / Em contato / Voluntariando /
  Encerrada" (`STAFF_STATUS_LABELS`, também na planilha), a pessoa lê "Recebida, ainda sem resposta / A ONG está
  falando com você / Voluntariado ativo / Encerrada" (`PERSON_STATUS_LABELS`); a API devolve só o código. A fila da
  equipe (`/api/admin/volunteer-applications`: lista com `status` e `area` por query, `counts` por situação
  respeitando só o filtro de área, `/counts` leve para o selo do menu, `/:id`, `PATCH /:id/status`, `/export.csv`)
  ordena nova → em contato → voluntariando → encerrada, e a mais recente primeiro dentro de cada. O `PATCH` grava
  **uma coluna** (`fields: ['status']`) e qualquer passagem entre as quatro situações existe; reabrir uma encerrada
  quando a pessoa já tem outra viva é 409 `live_application_exists`, pelo mesmo índice. Nome, e-mail e telefone vêm
  do perfil e nada além disso sai. No front, `/voluntariado/candidatura` é uma **rota de primeiro nível** que monta
  o próprio `<Layout>`: sem conta (10d) e formulário (10e) escondem cabeçalho e barra inferior no celular e põem a
  `BackBar`; "você já se candidatou" (10f) mantém os dois — `Layout` aceita `hideHeaderOnMobile`/`hideBottomBar`
  por prop porque a mesma URL muda de moldura conforme o estado, o que `handle` de rota não faz. `/admin/voluntarios`
  e `/admin/voluntarios/:id` são a mesma tela: no desktop lista e detalhe lado a lado (a primeira linha vem
  escolhida), no celular a lista e o item em tela própria; os filtros vivem no endereço.
- **Fila de mensagens da equipe (RF29), `/api/admin/contacts`**: `authenticate` + `requireStaff` no router inteiro e
  `Cache-Control: no-store`. É o outro lado de `POST /api/contacts` (aberto, sem conta) na **mesma tabela**, e é de
  propósito que os dois não se misturam: o público grava e nunca lê, a equipe lê e triagem. Rotas: `GET /` (`?status=`,
  `?page=`, `?pageSize=` padrão 20 e teto 100; devolve `data`, `counts` por situação **sem olhar o filtro** e
  `pagination`), `GET /counts`, `GET /export.csv` (mesmo filtro, sem paginação), `GET /:id` e `PATCH /:id`. **Não há
  `DELETE` nem `POST` ali**: a mensagem é registro, e excluir a pedido da pessoa (LGPD) é decisão à parte, hoje por SQL.
  **Duas travas, uma em cada sentido.** (1) O formulário público **não** aceita `status` nem `staffNote`: o esquema Zod
  os descarta e `receiveContact` lista as colunas à mão, então a linha nasce `new` e sem nota (teste unitário e de
  integração com corpo hostil). (2) O `PATCH` da equipe grava **só `status` e `staff_note`**: Zod descarta o resto, o
  controller só repassa essas duas chaves e o service chama `update(..., { fields: ['status', 'staffNote'] })` — três
  camadas, e a de baixo é a que o teste de integração derruba sozinha (nome, e-mail, telefone, mensagem e hash ficam
  idênticos no banco). Corpo vazio, situação fora de `new | in_contact | done` ou nota acima de 2000 caracteres é 400;
  nota vazia ou `null` apaga. **A ordem da fila é feita no SQL** (`FIELD(status, 'new', 'in_contact', 'done')`, depois
  `created_at DESC`, depois `id`), e a paginação corta essa lista já ordenada — ordenar em JavaScript depois do
  `LIMIT` repetiria e perderia mensagens entre páginas (há teste de integração com 10 linhas em 4 páginas). A resposta
  nunca traz `origin_hash` nem `consented_at`: o `SELECT` nem pede essas colunas. A planilha neutraliza fórmula
  (`= + - @`) também na nota interna, que é texto livre da equipe. No front, `/admin/contatos` e `/admin/contatos/:id`
  são a mesma tela (lista e detalhe lado a lado no desktop, tela própria no celular); filtro e página vivem no
  endereço (`?status=`, `?pagina=`), e trocar o filtro volta à primeira página. **O estado de "gravando a nota" e o de
  "gravando a situação" são duas mutações separadas**: com uma só, tocar no botão principal logo depois de digitar a
  nota fazia o `blur` iniciar o salvamento, o botão ficava desabilitado entre o toque e o clique e a situação **nunca
  era enviada** (medido no Chromium; há teste).
- **Troca de rota move o foco para o `<main>`** (`useRouteFocus`), comparando com o caminho
  anterior — uma trava de "primeira vez" quebra no StrictMode (medido, há teste).

## Status por módulo

Atualizado em 12/10/2026.

| Item | Status |
|---|---|
| Estrutura do repositório (Anexo I, 3.2) | **pronto** |
| `docs/originais/` | **pronto** — cópia do .zip da Submissão Institucional, conferida arquivo a arquivo com `diff` |
| Back-end base: Express, CORS, helmet, erro único, validação, JWT, bcrypt, Swagger | **pronto** — 22 testes Jest; `/api/health` medido contra MySQL 8.4 real (200 com banco, 503 sem) |
| Migrations (Umzug) | **pronto** — `up`/`down` medidos contra MySQL real; tabelas `events` (com `requires_cpf`), `users`, `refresh_tokens` e `registrations` |
| Front-end base: Vite, React Router, React Query, Axios, Tailwind | **pronto** |
| Design system — fundação visual (F1): tokens, Bitter local, escala de tipo, 3 níveis de elevação, Button (com estado "Enviando…"), TextField, PasswordField, PageHeader, ListItem, Card, DateBadge, Tabs, ChipFilter, EmptyState, BackLink, ActionBar, aviso fixo (toast) com ação | **pronto** — 49 testes Vitest, mais a cor e o estilo de erro (ver Regras do layout); conferido no Chromium a 320, 390 e 1440px, com A+ no máximo e alto contraste: sem rolagem horizontal, nenhum alvo abaixo de 44px |
| Estrutura (F2): cabeçalho, barra inferior, menu em folha (com a barra visível por baixo, como na 3a), rodapé, layout focado, link de pular, foco e fade de 150ms na troca de rota | **pronto** — Esc, retorno do foco e trava de rolagem medidos no Chromium. Uma rota pode trocar a barra inferior pela barra de ação com `handle: { hideBottomBar: true }` (usado pelo formulário de evento) |
| Movimento sutil (seção "Movimento" do desenho) | **pronto, medido no Chromium** (14/10/2026) — tokens de duração, `LoadingState`/`Skeleton` em 15 telas de carga, entrada de listas, rolagem (primeiro erro, grupo do responsável, "voltar", passos do formulário), saída da folha do menu e do aviso, `<details>` com altura, botão "Enviando…" com anel e largura fixa; regra e onde mora cada padrão em "Movimento" nas Regras do layout. 541 testes Vitest (20 em `motion.test.tsx`, mais os de tokens). **Medido:** CLS de `/agenda` 0,108 → 0,007 (390px) e 0,032 → 0,001 (1440px), `/minha-conta` 0,117 → 0,075 e 0,047 → 0,029; com `prefers-reduced-motion` todas as animações e transições caem a 0,01ms, a rolagem fica instantânea e o aviso sai sem saída animada; foco continua indo para o `<main>` na troca de rota; sem rolagem horizontal a 390 e 1440 (a 320 com A+ e alto contraste, `/quem-somos` já rolava 10px antes, por causa da faixa de chips). **Diferenças de propósito:** sem saída de página (ver a regra), sem View Transitions (travam o toque por 150ms e só existem no Chromium), sem IntersectionObserver (a entrada é CSS e roda uma vez ao montar). **Falta:** conferir `@starting-style` e `::details-content` em Safari e Firefox reais — onde não existem, a folha e o `<details>` abrem e fecham sem animação, como antes |
| Fidelidade ao design — rodada 8 (telas 3f, 6b, 8a e 8b, mais o que elas compartilham) | **pronta, conferida número a número** (texto, tamanho, peso, cor e caixa) contra o `.dc.html` renderizado, e a olho no Chromium a 390, a 320 com A+ e alto contraste e a 1440. **Entrar (3f/8b):** o lado esquerdo do desktop traz o texto do desenho — "Para acompanhar sua candidatura ao voluntariado e suas doações" e a lista numerada de três benefícios —, **por decisão do grupo, embora candidatura e doações ainda não existam no site** (tirar quando o texto deixar de ser verdade não é automático: revisar junto com RF19–RF26); celular com "Voltar" simples, aviso "Depois de entrar, você volta para…" depois do botão e título de 30px; desktop com cabeçalho focado (logotipo à esquerda, "Voltar para <destino>" à direita), duas colunas, **um único aplique** no cartão do formulário e rodapé mínimo. **Menu "Mais" no desktop (8a):** painel de 1200px preso ao cabeçalho (que não escurece; "Mais" fica escuro com seta para cima), três colunas só com o que o cabeçalho não repete, cada item com uma linha de explicação, cartão "Fale com a gente" com os controles de leitura; abre **ao passar o mouse em "Mais"** (pedido do grupo; o clique também abre), fecha com Esc, clique fora, ou ao levar o ponteiro para a página escurecida ou para longe do botão, e o foco vai para o primeiro item. **Aparece com um fade de 180ms (o painel desce 8px; a página escurece em 150ms)**, e `prefers-reduced-motion` o reduz a nada. **Sai com o mesmo fade, ao contrário (150ms)**: o `<dialog>` só fecha depois da animação (o painel guarda o estado `leaving`), e voltar o ponteiro para "Mais" no meio da saída reabre. Depois de fechar, o menu **não reabre sozinho se o ponteiro ficou parado em cima de "Mais"** (o navegador dispara um `mouseenter` falso quando o cabeçalho reaparece; o `Header` compara as coordenadas), e o painel de desktop **não trava a rolagem da página** (a barra sumindo empurrava o layout). É outro componente (`DesktopMenu`), escolhido por `useMediaQuery` — o celular continua com a folha de baixo. **Agenda no desktop (6b):** coluna lateral com "Tipo" e o cartão de escolas (o filtro só some quando não há tipo nenhum; o cartão de escolas aparece sempre), destaque com a data ao lado do texto. **Globais:** contêiner de 1200px, escala tipográfica, rodapé, `DateBadge` com cinco tamanhos, campo de 52px (a caixa, não o `input`), botão de aplique com sombra de 4px, **campo obrigatório sem asterisco** (o desenho só marca o opcional, com "(opcional)"). **Diferenças de propósito:** sem "Biblioteca" no cabeçalho nem "Depoimentos", "Para empresas" e "Perguntas frequentes" no painel (não existem); sem foto no destaque da agenda e sem "Ver detalhes"; sem "Esqueci minha senha" (depende de e-mail, RF08/10); "Acervo" no painel não tem linha de explicação porque o desenho não tem texto para ele; no painel do desktop, quem está logado ganha "Minha conta"/"Painel" (o desenho não tem, e sem isso a equipe perderia o único caminho para `/admin` no desktop). **A confirmar com a ONG:** o horário "seg a sáb, 9h–18h" do cartão de contato vem do desenho, não de um documento da ONG. O título tem 30px em 3f e 28px em 3d (o desenho varia por tela); as demais telas seguem os 32px |
| Home (RF01, tarefa 4.1) | **pronta**: herói, "Por onde começar", "O que fazemos" e escolas conferidos lado a lado com as telas 2a e 6a, e "Próxima atividade" ligada à API de eventos (conferida no navegador com evento real; sem evento publicado ou com a API fora do ar, o bloco não aparece) |
| Agenda (RF14, tarefa 4.2) | **pronta, com 4 diferenças do desenho listadas abaixo**: `/agenda` com abas Em breve / Já aconteceu, filtro por tipo (chips no celular, coluna no desktop), próximo evento em destaque, "+ Agenda" (`.ics`) e estados vazio, carregando e falha. Conferida no Chromium contra o backend e o MySQL reais, a 320, 390, 1024 e 1440px, com A+ no máximo e alto contraste. Backend: `GET /api/events` e `GET /api/events/:id/calendar.ics`, 39 testes unitários + 7 de integração |
| Cadastro e edição de eventos (RF13) | **pronto**: `/admin` (home do painel), `/admin/eventos` (rascunhos e publicados em seções, "Publicar"/"Tirar do ar" com "Desfazer" no aviso), `/admin/eventos/novo` e `/admin/eventos/:id/editar` (título, tipo, início e término, local, faixa etária, **limite de vagas e exigência de CPF, os dois opcionais**, descrição). Backend: 47 testes unitários + 12 de integração contra MySQL real (403 para quem não é equipe, promoção e rebaixamento valendo na requisição seguinte, rascunho invisível na agenda pública, publicar/tirar do ar, horário de São Paulo gravado como UTC, acento e emoji, sem DELETE). Frontend: 21 testes. **Conferido no Chromium contra a API e o MySQL reais** (390, 320 com A+ e alto contraste, 1440): conta comum vê o 404, equipe cria um rascunho, a agenda pública **não** o mostra, publicar o faz aparecer com "15h–17h", editar mantém publicado, tirar do ar o remove; sem rolagem lateral e sem alvo abaixo de 44px. **Moldura, home e formulário: ver a linha "Painel no padrão das rodadas 9 e 10"** (a tela 2c, de cabeçalho escuro, foi substituída). **Falta:** a **foto** do evento (não há upload nem autorização de imagem) e a **lista fechada de tipos** (hoje texto livre, com a dica "escreva sempre do mesmo jeito"). Em desenvolvimento, `admin@atelie.local` é equipe (seed); em outro ambiente ninguém é equipe sem SQL (`update users set is_staff = true where email = '…'`) |
| Inscrição em evento (RF15) | **pronta, com e sem conta**: `/agenda/:id/inscricao` (tela 3d: evento no topo, "Sua inscrição", voltar com o nome do destino, barra de ação fixa). Sem conta: "Não precisa criar conta"; com conta: nome, e-mail e telefone já preenchidos e a inscrição ligada à conta, e dá para trocar o nome e inscrever outra pessoa. CPF só se o evento pede; "menos de 18 anos" abre o responsável; imagem opcional, dita por escrito; consentimento obrigatório. Depois de inscrever: "Inscrição registrada", "+ Agenda", **"Inscrever outra pessoa"** e voltar. A agenda e a home mostram **vagas restantes** (não mais a capacidade) e "Vagas esgotadas" no lugar do botão; o painel mostra quantas inscrições cada evento tem. Backend: 60 testes unitários novos e 16 de integração contra MySQL real, **inclusive concorrência** (5 pessoas para 1 vaga → exatamente 1; 12 para 4 → exatamente 4; duas iguais ao mesmo tempo → 1). Frontend: 28 testes novos. **Conferido no Chromium contra a API e o MySQL reais**: visitante inscreve (CPF inválido recusado, válido gravado só com os dígitos), duplicata recusada com mensagem, menor sem responsável recusado e com responsável gravado, conta `usuario@atelie.local` entra com dados preenchidos e a linha fica ligada à conta, a terceira vaga esgota a agenda e a página de inscrição vira "As vagas acabaram"; sem rolagem lateral e sem alvo abaixo de 44px a 390, a 320 com A+ e alto contraste e a 1440. **Diferenças do desenho 3d, de propósito:** a dica do e-mail não diz "é por aqui que confirmamos a inscrição" — **não existe e-mail de confirmação (RF18)**, e prometer um seria mentira; sem o link "Privacidade" (a página não existe); "menos de 18 anos" é uma caixa de marcar, não um interruptor. **Falta:** RF18 (e-mail). RF17 e "Minhas inscrições" existem desde 09/10/2026 (linhas abaixo). O requisito diz "sem JavaScript"; numa aplicação de página única isso não vale mais (Changelog) |
| Cadastro e login (RF08, RF09, RF10, RF12) | **prontos, com RF10 parcial**: `/entrar` (abas Entrar / Criar conta), `/minha-conta` (ver Minha conta e Alterar meus dados), cabeçalho com o primeiro nome + "Sair", bloco "Sua conta" no menu. **A sessão sobrevive ao recarregar** (cookie de renovação `httpOnly` + token de acesso em memória; ver Arquitetura). Backend: 63 testes unitários de auth/sessão + 25 de integração (corpo hostil, cadastro simultâneo → 201 + 409, hash gravado, rotação, reuso, logout, conta apagada). Conferido no Chromium contra a API e o MySQL reais a 320, 390 e 1440px, com A+ e alto contraste: sem rolagem lateral, nenhum alvo abaixo de 44px, o script da página só enxerga `af-session=1` (cookie `httpOnly` invisível, token fora de storage), recarregar mantém a sessão, duas abas recarregando juntas ficam as duas logadas, token de acesso vencido é renovado sem a pessoa notar (`401` → `refresh` → repete), sair apaga o cookie e recarregar não restaura, `is_staff` continua 0 com corpo hostil. **Ainda não medido:** `COOKIE_SAMESITE=none` entre domínios de verdade, e HTTPS (`Secure`) — só há `localhost`. **Falta: recuperar senha** (exige envio de e-mail, que depende de escolher o provedor) |
| Consulta de inscritos (RF16) | **pronta**: `/admin/eventos/:id/inscritos`, alcançada por "Ver inscritos (N)" em cada evento do painel. Um cartão por pessoa com o nome, **a autorização de imagem dita por escrito em toda linha** ("Autorizou imagem"/"Não autorizou imagem", nunca só cor) e "Menor de idade"; contato, CPF (só se existe), responsável e conta atrás de uma dobra "Contato e dados", com `mailto:`/`tel:`. Totais no topo (inscritos, autorizaram imagem, menores) e **"Baixar planilha"** (CSV). Só leitura, e a tela diz isso. Estados vazio, carregando, falha com "Tentar de novo" e 404. **Limite por conexão** (30/h, HMAC do IP; ver Arquitetura) entra no mesmo PR. Backend: unitários + 14 de integração novos contra MySQL real (limite, janela de uma hora, IPv6 /64, hash sem IP, lista, CSV com BOM e fórmula neutralizada, 401/403, sem POST/PUT/PATCH/DELETE), **com mutação**: tirar o limite, a janela, a neutralização ou o `requireStaff` derruba teste. Frontend: 8 testes novos. **Conferido no Chromium contra a API e o MySQL reais** (30 inscritos, um menor, um nome `=HYPERLINK(...)`): a 390, a 320 com A+ e alto contraste e a 1440, sem rolagem lateral e sem alvo abaixo de 44px; o download saiu como `inscritos-cafu-e-o-cafe.csv`. **Falta:** corrigir ou apagar inscrição (de propósito), filtro e busca na lista (só vale quando houver evento com centenas) e ninguém é equipe fora do ambiente local sem SQL |
| Lista de presença (RF17, desenho 3g) | **pronta**: `/admin/eventos/:id/presenca`, pelo botão "Lista de presença" de cada evento. Cabeçalho creme fixo com "Voltar" para os inscritos e "N de M", progresso ("12 de 18 conferidos", "10 vieram · 2 faltaram" e uma barra) e a busca pelo nome; abaixo, **"Sem conferir" em cima e "Conferidos" embaixo**, cada grupo contado — quem falta conferir sobe, quem foi conferido desce e encolhe (badge "Veio"/"Faltou" + "Limpar"). **Três estados**, e o terceiro não é falta. Nome como "Ana S." (primeiro nome e inicial; quando duas pessoas leriam igual, o nome inteiro) e, para menor, "Responsável: (11) 9····-1234" mascarado. Botões "Veio" e "Faltou" de 48px, com o estado por texto. Marcar mostra um aviso "X marcado como veio" com **"Desfazer"**; a marca aparece na hora e volta, com aviso, se a rede falhar. **Sem e-mail, CPF nem telefone inteiro na tela e na resposta.** A planilha de inscritos ganhou a coluna "Presença" (Veio / Faltou / Não conferido). Sem paginação (numa lista de presença "página 2" é onde as pessoas somem). Backend: unitários + 6 de integração contra MySQL real, **com mutação**; frontend: 11 testes, também com mutação. **Conferido no Chromium contra a API e o MySQL reais** a 390, a 320 com A+ e alto contraste e a 1440, sem rolagem lateral e sem alvo abaixo de 44px; o contraste do cabeçalho escuro em alto contraste precisou de ajuste (a borda da busca e a trilha do progresso sumiam). **Diferenças do desenho, de propósito:** o cabeçalho do painel some só no celular (a lista traz o próprio) e no desktop a lista mora numa coluna de 36rem ao lado do menu lateral; a barra inferior segue com Início/Agenda/Mais (o desenho tem "Mensagens", que não existe). **Falta:** o relatório (RF30–32) contar presentes e uma trilha de quem marcou |
| Painel no padrão das rodadas 9 e 10 (desenhos 9a–9c e 10a–10e) | **pronto para o que existe, conferido número a número contra o `.dc.html` e a olho no Chromium a 390, 320 com A+ e alto contraste e 1440** (sem rolagem lateral; nenhum alvo abaixo de 44px no celular). **Início (9a/10a):** "Bom dia, <nome>" com a data de São Paulo, **Próximo evento** (cartão com o único aplique, "Abrir lista de presença"), "Depois" (só no desktop), "+ Novo evento" e **"Precisa de você · N"**, que conta só o que existe de verdade: **rascunhos para publicar** (com um verbo, "Publicar"), e diz "Nada esperando você. Tudo em dia." quando não há. **Formulário de evento (9c/10d):** no desktop, uma coluna de 720px com seções numeradas (1 O que é, 2 Quando e onde, 3 Inscrições) e **Dia / Início / Fim** em campos separados; no celular, **um passo por tela** com barra de progresso, "Anterior" e "Próximo: …", e um erro do servidor leva a pessoa ao passo do campo recusado. **Lista de presença, inscritos, eventos e relatório** usam a mesma moldura, `AdminPage` e `AdminTitle`; a lista de presença trocou o cabeçalho escuro por um creme com "N de M". **Diferenças de propósito (tudo o que o desenho tem e não existe):** busca global do cabeçalho; menu lateral e "Mais" só com Início, Agenda/Eventos e presença, Relatório e Minha conta (sem Atividades, Contatos, Doações, Depoimentos, Publicações, Galeria, Biblioteca, Avisos, Exportar, Configurações, Ajuda); "Pessoas" na barra; selos de contagem; a fila com detalhe (9b/10b/10c); "+ Subir fotos"; no formulário, "Projeto", "Salvo às…"/"Rascunho salvo às…" (não há autosave) e "Publicar na agenda" (aqui **salvar não publica**: quem publica é o botão da lista); "Local" é texto, não "Na sede / Outro lugar". **Decisões sem desenho:** "Minha conta" e os controles de leitura ficam na folha "Mais" (senão a equipe perderia os dois no celular); o item do menu lateral tem 44px de altura, e não os 40px do desenho, pela regra do alvo de toque. **A confirmar:** "Precisa de você" mostra rascunhos porque é o único pendente que o sistema sabe contar; contatos e depoimentos entram quando existirem (as candidaturas já existem, e não entraram aqui) |
| Minhas inscrições (RF11) | **pronta**: seção em `/minha-conta`, "Próximas" e "Já aconteceram", com o evento, a data no fuso de São Paulo, o nome de quem foi inscrito (dá para inscrever outra pessoa com a mesma conta) e, em atividade encerrada, "Presença registrada" só quando a equipe marcou. Estados vazio (explica que inscrição feita sem entrar na conta não fica ligada a ela), carregando e falha com "Tentar de novo". **Não há cancelar inscrição** (não está no escopo desta entrega). Backend: 6 unitários + 3 de integração (duas contas, nenhuma lê a outra) e mutação no filtro por conta; frontend: 5 testes. Conferido no Chromium a 390 e 1440 contra a API e o MySQL reais |
| Minha conta e Alterar meus dados (RF11, desenhos 7a e 7b) | **prontas**: `/minha-conta` abre com a ficha (nome, telefone, tipo, e-mail com a frase de por que não muda aqui), o botão "Alterar meus dados" e "Minhas participações"; o aviso "Seus dados foram atualizados." aparece uma vez, depois do redirect. `/minha-conta/dados` é **tela própria** (layout focado, não gaveta): Nome, Telefone "com DDD", "Você é" em controle segmentado (Pessoa física / Empresa), e-mail como texto, "Cancelar" e "Salvar" na barra de ação. Erro: um aviso só no topo ("Confira o telefone marcado abaixo.") e a mensagem no campo; o que foi digitado fica. Backend: 11 unitários + 5 de integração contra MySQL real, com mutação (corpo hostil com e-mail, papéis e senha; conta de outra pessoa; mensagem do desenho); frontend: 10 testes novos, com mutação. **Conferido no Chromium contra a API e o MySQL reais** a 390, a 320 com A+ e alto contraste e a 1440, sem rolagem lateral; teclado: Tab chega ao seletor e as setas trocam de opção. Componente novo `SegmentedField` (no catálogo) e `TextField` ganhou `labelNote`. **Diferenças do desenho, de propósito:** a lista "Minhas participações" **só tem o que existe** — as inscrições; o item "Candidaturas ao voluntariado" existe desde 11/10/2026 (linha própria); "Minhas doações" e "Trocar minha senha" estão no desenho mas as funcionalidades não existem (doações) ou dependem de e-mail (senha), então **não aparecem**; a linha "Participação" da ficha antiga saiu, como no desenho; o rótulo "Empresa" vale só nestas duas telas (o cadastro segue com "Organização (pessoa jurídica)"). **Falta:** esses dois itens, quando as funcionalidades existirem |
| Cancelar inscrição (RF15, desenhos 7c/7d) | **pronta**: `/inscricao/cancelar?c=<código>` (layout focado, "Voltar para a agenda") e, depois de cancelar, `/inscricao/cancelada?c=<código>` no layout público, com logotipo e barra inferior como no 7d; recarregar essa tela volta para a confirmação, que diz "já foi cancelada". 7c pergunta ("Cancelar a inscrição?", o evento, "Inscrição de Ana P.", dois botões do mesmo tamanho — "Sim, cancelar minha inscrição" e "Manter inscrição"); 7d confirma ("Feito", "Inscrição cancelada", "Ver a agenda") e mostra "Quer ir em outra data?" com até três atividades que ainda têm vaga (some se não houver, em vez de inventar). Link já usado, atividade passada ou código desconhecido caem na mesma moldura, com o WhatsApp. Backend: unitários + 10 de integração novos contra MySQL real (vaga liberada, inscrever de novo, cancelar três vezes a mesma pessoa, 409 na segunda, depois do evento, dois toques ao mesmo tempo, some da lista/presença/planilha/contagem/"Minhas inscrições", limite de e-mail liberado e o de conexão não); **migration testada com 39 linhas reais** (todas ganharam código único) e `down`/`up` conferidos; frontend: 12 testes, com mutação. **Conferido no Chromium contra a API e o MySQL reais** a 390, a 320 com A+ e alto contraste e a 1440, sem rolagem lateral e sem alvo abaixo de 44px. **Entradas para o link** (o desenho diz só "abre pelo link da confirmação", e não há e-mail — RF18): um link "Cancelar esta inscrição" na tela "Inscrição registrada" e "Cancelar inscrição" em cada inscrição futura de "Minhas inscrições". **Esses dois pontos de entrada não estão nos desenhos.** **Falta:** o link no e-mail de confirmação (RF18) |
| Relatório (RF30–RF32, desenhos 7i e 7j) | **pronto, com os números que existem**: `/admin/relatorio` (menu lateral e "Todas as telas"). Período em controle segmentado (Mês / Trimestre / Semestre) com "‹ Anterior" e "Seguinte ›" (o segundo desligado na janela atual; no celular, setas e o nome do período); quatro números (atividades realizadas, pessoas inscritas, presentes conferidos, crianças e adolescentes presentes), a frase de que "sem conferir" não é falta, e **"Por atividade"**: tabela no desktop (Atividade, Quando, Inscritos, Vieram, **Faltaram** em coluna própria, Sem conferir, barra, "Total da lista") e lista com barra no celular. **"Baixar CSV"** (todas as atividades, com total) e **"Salvar em PDF"** (imprimir; sem biblioteca). O período vai no endereço (`?periodo=trimestre&recuar=1`) e valor inválido cai no mês atual. Backend: unitários + 8 de integração contra MySQL real, **com mutação** (canceladas, limites da janela, "sem conferir" fora de "faltou", rascunho, atividade futura, guarda de equipe, zero no lugar de traço); frontend: 23 testes, também com mutação. **Conferido no Chromium contra a API e o MySQL reais** com 80 inscrições de teste (já apagadas): a 390, a 320 com A+ e alto contraste e a 1440, sem rolagem lateral; **a impressão foi conferida** a 1440 e a A4 (794px), com o cabeçalho, o menu e os botões fora do papel e as barras com cor. **Diferenças do desenho, de propósito:** **faltam três números do desenho — "novos voluntários", "novos doadores" e "valor recebido"** —, porque os módulos de voluntariado e doações não existem aqui e não há de onde tirá-los (inventar uma aproximação seria mentir numa prestação de contas); o painel no celular esconde o cabeçalho escuro nesta tela (o desenho tem a própria barra "‹ Painel" e "EQUIPE"); em A+ a barra de ações do celular empilha os dois botões em vez de espremê-los. **Falta:** os três números acima, quando RF19–RF26 existirem |
| Quem somos (RF02, desenho 5b) | **pronta**: `/quem-somos` fiel ao 5b — hero com a frase-missão e card de aplique, índice de chips fixo com destaque da seção visível (`IntersectionObserver`, `aria-current="location"`), Sankofa em bloco escuro com a faixa listrada, idealizadores com etiquetas e linha do tempo, os três setores (fotos de `lib/sectors.ts`, compartilhadas com a home), "Para quem", "Onde estamos" com mapa do Google sem chave e "Como chegar", e chamada final para `/projetos`, `/voluntariado` e `/doar` (constantes de `lib/navigation.ts`). Só frontend. 9 testes Vitest. **Conferido no Chromium** a 390, 320 e 1440px, sem rolagem lateral. **Diferenças de propósito, por decisão do Yuri (fidelidade total ao 5b):** texto resumido do desenho em vez do texto literal da V1 (o RF02 pede "palavra por palavra"); placeholders "Símbolo Sankofa (arte da ONG)" e "Foto de Wil e Nathy"; sobretítulo "Quem somos" e faixa listrada dentro da página, contrariando duas regras de layout deste guia. **Falta:** arte do Sankofa e foto do casal (ONG), aprovação do texto resumido pela ONG, Maps Embed API com chave restrita e `frame-src https://www.google.com` na CSP do deploy |
| Contas — o que ainda falta | RF11 tem a ficha, editar os próprios dados e "Minhas inscrições" (linhas próprias); **faltam** as doações, que não existem, e trocar a senha, que depende de e-mail. **Fora do ambiente local ninguém é equipe ainda**: só por SQL (no local, a seed cria `admin@atelie.local`). **Sem limite de tentativas de login** — adiado de propósito; a infraestrutura de origem (`originHash`, `TRUST_PROXY`) já existe, falta só decidir o número (uma escola inteira atrás do mesmo IP não pode ser trancada) e conferir a topologia do deploy. O texto do "lead" de `/entrar` não promete doação, que ainda não existe |
| Contato (RF06, RF07, desenhos 10a, 10b e 10h) | **pronto** (11/10/2026): `/contato` (era 404 no menu "Mais" e na folha do celular). Botões "Chamar no WhatsApp" (aplique) e "Ligar" (`tel:`), "Canais diretos" com os seis canais reais (`lib/contacts.ts` ganhou `youtube`, `phoneLink`, a rua, a cidade e o CEP), formulário "Ou mande uma mensagem por aqui" (nome, e-mail, telefone e instituição opcionais, mensagem, concordância obrigatória) e "Onde estamos" com endereço escrito, CEP e mapa. Os canais vêm **antes** do formulário e, no desktop, ficam lado a lado com ele (10h). Recusa: um aviso no topo do formulário ("Confira o e-mail marcado abaixo.") e a regra embaixo de cada campo, com o que foi digitado mantido. Sucesso: a caixa "Mensagem recebida" aparece **no topo da página** (foco nela, rolagem para o topo), o formulário volta limpo e recarregar não repete o aviso (é estado da tela, não da URL). Erro de rede e o `429` têm frase própria; **nenhum prazo de resposta é prometido**. "Mais" fica marcado no cabeçalho do desktop e "Menu" na barra do celular quando a rota é de menu (`isMenuRoute`, lido das listas de `navigation.ts`). Backend: 47 testes unitários + 13 de integração contra MySQL real, **com mutação** (tirar o limite, a janela de uma hora, o consentimento, a validação de e-mail, de mensagem e de instituição, a data do consentimento, gravar o IP cru, devolver dado na resposta e passar o corpo inteiro ao service — este só cai com as duas travas removidas); frontend: 22 testes, também com mutação. **Conferido no Chromium contra a API e o MySQL reais** a 390, a 320 com A+ e a 1440: sem rolagem lateral e sem alvo abaixo de 44px; a mensagem chegou ao banco com o telefone só em dígitos, o e-mail em minúsculas e o consentimento como data; a 31ª mensagem da mesma conexão recebeu 429. **Diferenças do desenho, de propósito:** (1) a frase de privacidade **não tem link**, porque `/privacidade` ainda não existe (card próprio) — e o rodapé continua apontando para ela; quando a página existir, a palavra vira link; (2) o mapa é o **embed do Google sem chave** (como no projeto de origem), dentro da moldura do desenho (altura de 180px no celular, 15rem de largura no desktop), com o hachurado e o rótulo "Mapa" por trás para o caso de o frame não carregar; ele só é buscado quando a pessoa rola até ele (`loading="lazy"`), e **/privacidade precisa dizer que o mapa é carregado pelo Google** quando existir; (3) "opcional" fica no rótulo de telefone e de instituição nos dois tamanhos (no desenho do celular a palavra está na ajuda), e a ajuda da instituição usa o texto curto do desktop; (4) o campo tem 52px nos dois tamanhos (o desenho do desktop tem 50px) pela regra do alvo; (5) o corpo do aviso "Mensagem recebida" não tem o `opacity` das linhas de "Canais diretos" que o desenho mostra por baixo — são linhas cortadas pela moldura do celular; (6) a ajuda dos campos passou de 14px para 13,5px em `FieldMessages` (todas as telas), que é o tamanho dos desenhos. **A fila para a equipe ler e atender as mensagens existe** (RF29, linha "Mensagens de contato") |
| Para escolas (RF38, desenhos 11h e 11i) | **pronta, estática** (12/10/2026): `/para-escolas` (era 404 no menu "Mais", na folha do celular, no banner da home e no cartão da agenda). Foto de largura total no celular e, no desktop, hero em duas colunas com a foto à direita (`sector-literary.jpg`, já pública, com alt descritivo); "Que atividades existem", "Formato e duração" (ficha de 4 linhas), "O que a escola precisa providenciar" (3 itens), "Onde já estivemos" (11 locais, **a seção some inteira se a lista estiver vazia**) e "Solicitar uma atividade". Textos copiados do desenho, que os tirou da ONG; dados em `lib/schools.ts`, contatos de `lib/contacts.ts`. Celular: barra fixa acima da barra inferior com "Falar pelo WhatsApp" + "Enviar e-mail" (padrão da de voluntariado; empilha abaixo de 24rem); desktop: botões no topo e no cartão da direita (ficha + pedido juntos). Sem API e sem banco. Frontend: 11 testes, com mutação (omissão da seção vazia, link do formulário, item removido). **Conferido no Chromium** a 390, a 320 com A+ no máximo e a 1440: sem rolagem lateral, barra não cobre o fim da página, botão empilha a 320px. **Diferenças do desenho, de propósito:** "Ver o catálogo completo" leva a `/projetos`, que ainda não existe (404, como os demais links do menu); o desenho tem aplique na foto (sombra ocre) **e** no botão do WhatsApp, o que excede o "no máximo um aplique por tela" — decisão do desenho, a confirmar com quem desenha; a ordem de leitura (DOM) das seções do cartão difere da visual no celular (Solicitar vem antes de providenciar no código, por causa do cartão único do desktop). **Não verificado:** em aparelho real; a mensagem enviada por `/contato` **não chega com a origem "Para escolas"** que a nota do desenho promete (não existe coluna de origem; ver Pendências) |
| Páginas | Home, agenda, quem somos, contato, para escolas, entrar, minha conta, voluntariado, painel (`/admin`, eventos, mensagens, voluntários), 404 e catálogo. Os outros links do menu (galeria, notícias, acervo, projetos, quem somos, privacidade) levam ao 404 até cada tela ser migrada |
| Conferência com o zip do Claude Design (11/10/2026) | **feita para todas as telas implementadas** (as de voluntariado, 10c–10k e o item da 7a, estão nas linhas próprias), em 390 e 1440px, medindo texto, tamanho, peso e cor e comparando lado a lado: paleta, Bitter, escala, aplique, cabeçalho de 60px, animações de 200/280/150ms e as telas 2a, 2b, 3a, 3f, 6a, 6b, 7a–7d, 7i, 7j, 8a, 8b, 9a, 9c, 10a e 10d batem, menos o que está no Changelog de 11/10 (seis ajustes feitos e o que ficou para decisão do design). **Dependem de quem desenha:** a barra inferior (5 itens nas rodadas 2–3, 4 com "Biblioteca" nas 7), os 3 passos do formulário de evento contra os 4 do desenho 10d, a cor de erro (`#A52A1E` aqui, `#A3341F` em 7) e o cabeçalho escuro do 3g |
| Voluntariado — página, candidatura e "Minhas candidaturas" (RF24, RF25, desenhos 10c–10g, 10i e 7a) | **pronto, conferido número a número contra o `.dc.html` e a olho no Chromium a 390, 320 com A+ e 1440, contra a API e o MySQL reais**. `/voluntariado` (5 áreas reais vindas da API, "Como funciona", ação fixa acima da barra no celular, duas colunas no desktop), `/voluntariado/candidatura` (sem conta, formulário e "você já se candidatou", ver Arquitetura), `/minha-conta/candidaturas` e o item "Candidaturas ao voluntariado · N em análise" em `/minha-conta`. Ponta a ponta medido: visitante vai para `/entrar?voltar=` e volta ao formulário; candidata-se com 2 áreas e texto; a tela vira "Você já se candidatou"; POST direto com candidatura viva → 409 e 1 linha no banco; a equipe muda a situação e a pessoa lê a frase nova; encerrada, o formulário volta e a segunda candidatura entra. Backend: 62 testes unitários e 26 de integração novos, **com mutação** (corpo hostil, duplicata no service e no índice, transação, áreas repetidas e inexistentes, duas contas, guarda de equipe, `fields` do `PATCH`, planilha, contagens, ordem da fila — 17 mutações, todas derrubam teste). Frontend: 112 testes novos, 12 mutações (uma 13ª, a do "mesmo estado", mostrou que a guarda era código morto, e ela saiu). **Diferenças do desenho, de propósito:** sem o cartão "Ver o mural de avisos" da 10g (RF27 não existe: um link para o 404 é pior que a ausência); o limite do texto é 2000 (o 1000 do desenho é exemplo; é o limite do projeto de origem); "Tenho uma dúvida" leva a `/contato`, **que depende de outra PR e responde 404 até lá**; o telefone e o e-mail das telas 10d/10f são links (em negrito e sublinhados) e não texto puro; a linha do tempo da 10f avança com a situação (2 etapas feitas em contato, 3 voluntariando), o desenho só mostra a 1ª; cabeçalho e barra inferior são os existentes ("Projetos"/"Apoiar", e não "Biblioteca"); a distância sobretítulo→título é a do `PageHeader` (7px a mais que o desenho, em todas as telas). **Falta:** nada do escopo do RF24/RF25; o botão "Quero me candidatar" não conhece "já se candidatou" (a tela seguinte resolve) |
| Gestão de voluntários (RF26, desenhos 10j e 10k) | **pronta, conferida como a linha acima**. `/admin/voluntarios`: chips de situação com contagem ("Novas · 2"), filtro por área, "Exportar CSV" (mesmos filtros; `;`, BOM, fórmula neutralizada), situação em controle de 4 (grade 2×2 de 48px no celular), "Chamar no WhatsApp" (só se há telefone), ação principal do passo seguinte, e-mail e telefone como `mailto:`/`tel:`, aviso com "Desfazer" e a frase do servidor quando recusa. Entrada "Voluntários" em "Pessoas" no menu lateral e na folha "Mais", com **selo de novas** (só se > 0). Quem não é equipe vê o 404 (testado). **Diferenças de propósito:** a nota interna do 10j fica de fora (o desenho manda esperar a decisão da migration); sem a busca global do cabeçalho; os valores do contato no celular têm alvo de 44px (a linha fica 12px mais alta que os 59px do desenho); o botão "Exportar CSV" e os de "compact" têm o `px` do `Button` do projeto (12px mais largo que o desenho); o chip de área é um `<select>` nativo (largura pelo conteúdo só onde há `field-sizing`); o botão "Pessoas" da barra inferior do celular não existe (a entrada fica na folha "Mais"); a lista do celular não tem desenho (10b é de Contatos) e usa as mesmas linhas do desktop |
| Mensagens de contato — fila da equipe (RF29, desenhos 10l–10n) | **pronta, conferida a olho no Chromium a 390, 320 com A+ e 1440, contra a API e o MySQL reais** (sem rolagem lateral; no celular nenhum alvo abaixo de 44px; no desktop os chips têm 36px e os links da ficha 18px, como em Voluntários). `/admin/contatos`: título "Mensagens" e o lead do desenho, "Exportar CSV", chips "Todas / Novas · N / Em contato · N / Concluídas · N" (faixa rolável no celular; sem contador no topo — o número fica só no selo do menu), linhas com título (a instituição, ou a pessoa quando não há), selo da situação (no celular numa linha abaixo da prévia, no desktop ao lado do título), data relativa ("hoje", "ontem", "há 3 dias", "2 out") e a primeira linha da mensagem truncada; **concluídas esmaecidas e nunca escondidas**; paginação "Página 1 de N · ← Anteriores · Próximas →" (20 por página; a página vive em `?pagina=` e uma página que deixou de existir recua sozinha para a última) e a dobra fechada "Como funciona esta tela". Detalhe (`/admin/contatos/:id` no celular, painel de 33,75rem no desktop): "CONTATO · 8 out, 10:42", título, ficha (E-mail e Telefone como `mailto:`/`tel:`, "Quem escreveu" só quando há instituição), a mensagem inteira, "Em que pé está" em três opções com "Dá para voltar atrás.", **nota interna**, e a barra fixa "Responder por e-mail", "WhatsApp" (`wa.me/55…`; **desabilitado e dito em palavras quando não há telefone**) e a ação principal do passo seguinte — Nova → Marcar "em contato", Em contato → Marcar "concluída", Concluída → Reabrir (volta a "em contato") —, com o único aplique da tela. Toda mudança de situação mostra o aviso com "Desfazer". **A nota é salva quando o campo perde o foco** (e só se mudou), com a frase "Nota guardada." embaixo; foi a opção mais simples sem botão extra, e a que funciona com o teclado aberto no celular. Menu: entrada **"Mensagens"** (e não "Contatos", como o menu do desenho; as notas do 10l pedem unificar) em "Pessoas", antes de Voluntários, com selo de novas (só se > 0) no menu lateral e na folha "Mais"; `NewVolunteersBadge` e `NewContactsBadge` agora são duas finas camadas sobre `CountBadge`. Backend: migration `20261012100000` (`status` ENUM `new | in_contact | done` com padrão `new`, `staff_note` TEXT e índice `(status, created_at)`, `down` conferido), 5 rotas, Swagger e planilha; 48 testes unitários (47 da fila e 1 do formulário público) e 16 de integração (15 da fila e 1 do formulário) novos contra MySQL real, **com mutação** (tirar o `requireStaff`, o `offset`, a ordem por situação, o `fields` do `update` — este junto com o Zod frouxo e o controller repassando o corpo inteiro, que só caem as três juntas —, e a neutralização de fórmula). Frontend: 52 testes novos, 7 mutações (blur que salva, filtro que mantém a página, `wa.me` sem o 55, passo seguinte errado, nota que carrega a situação junto, WhatsApp sem `disabled`, nota e situação na mesma mutação). **Diferenças do desenho, de propósito:** (1) **sem origem** ("PARA ESCOLAS", "Biblioteca") e sem filtro por origem — `contacts` não tem essa coluna e o desenho mesmo manda confirmar; o sobretítulo diz sempre "CONTATO", porque é sempre o formulário de contato, e a origem só entra com migration e decisão do grupo; (2) **sem busca global** do cabeçalho; (3) a nota interna existe, e por isso a migration — o desenho avisa que ela depende disso; (4) selo "Painel" no topo do detalhe do celular, como no resto do painel (o desenho escreve "Equipe"); (5) "Responder por e-mail" abre o programa de e-mail, não responde de dentro do site (RF18 não existe); (6) no celular a ação principal tem o rótulo curto do desenho ("Em contato") e o nome completo vai no `aria-label`; (7) a lista não tem busca nem filtro por data. **Não verificado:** o botão "Exportar CSV" foi exercitado só com a API simulada no Vitest e por `supertest`/MySQL no back-end, não clicado no navegador; ninguém percorreu a tela com mensagens do formulário público real de ponta a ponta fora do banco semeado à mão |
| Docker Compose (MySQL + API + front) | **escrito** — o MySQL subiu e foi usado; as imagens do back-end e do front não foram construídas neste ambiente (o `npm ci` dentro do container não alcança o registro do npm daqui) |
| Funcionalidades (RF01–RF39) | **falta** — migrar de `venturus-atelie`, um RF por PR |
| Deploy | **parcial, não executado** — Dockerfiles de produção (`backend/`: migrations a cada subida, health check, `/uploads`; `frontend/`: nginx com fallback de SPA) prontos e testados em partes (build do front e do back, migrations compiladas contra MySQL, servidor em `production`, nginx); **o `docker build` completo nunca rodou** (o `npm ci` dentro do contêiner não alcança o registro do npm no ambiente de desenvolvimento) e nada foi publicado. Falta: hospedagem, domínio, `TRUST_PROXY` e cookie conferidos no ar, volume das fotos e backup |

## Pendências que dependem de gente

1. **Nome da equipe:** o .zip da submissão se chama `..._G3Z` e o repositório `...-g3x`. O
   RNF-REP-06 exige `fic2026-[fatec]-[equipe]` — se a equipe é G3Z, o repositório precisa ser
   renomeado.
2. Nomes e papéis da equipe no `README.md` e o revisor na tabela do `AGENTS.md`.
   **Todas as linhas de IA estão com "Revisado por: a preencher"**, e a seção 11.2 do regulamento exige
   que os alunos dominem e defendam cada parte do código.
2b. **O repositório está PÚBLICO** e o RNF-REP-01 exige **privado** (conferido em 10/10/2026 pela API do
   GitHub). Settings → General → Danger Zone → Change visibility. O acesso da banca (Read) vem depois,
   quando a organização divulgar as contas (RNF-REP-03).
2c. **Os 81 commits da `main` têm um autor só**, e a equipe tem 4 ou 5 integrantes. O RNF-REP-04 pede
   histórico que evidencie o trabalho da equipe: o restante do grupo precisa commitar de verdade.
2d. `origin/claude/amazing-carson-5lh8ry` tem 8 commits fora da `main` e o prefixo de ferramenta que
   as convenções proíbem; decidir se apaga.
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
     ("Contação" × "Contação de história") se a equipe digitar de dois jeitos.
6. **"Ler nossa história completa" leva ao 404** ("Ver como funciona" já abre `/para-escolas`): as páginas ainda não foram
   migradas. (O "Quero me inscrever" deixou de ser o caso: a inscrição existe, RF15.)
7. **A ONG nunca disse "inscrição sem conta"**: o formulário que ela enviou só lista voluntários e doadores
   como tipos de conta e pede para "facilitar as inscrições". Sem conta é decisão da nossa equipe, e agora
   a inscrição também funciona com conta. **Confirmar com o Wil ou a Nathy** e registrar no Changelog.
8. **Inglês**: o formulário da ONG marcou "Outro (inglês também se possível)". O projeto de origem tinha
   `/en`; aqui ainda não.
9. **Para escolas — origem da mensagem e catálogo:** a nota do desenho 11h diz que quem usa "Use o formulário"
   chega à fila com origem "Para escolas" (desenho 10l), mas `contacts` não tem coluna de origem e a tela de
   mensagens escreve sempre "CONTATO". Nada foi criado; **pedir confirmação ao grupo** (coluna `source` + parâmetro
   `?origem=` em `/contato`, ou aceitar sem). "Ver o catálogo completo" depende de `/projetos`, que ainda não existe.
5. Requisitos do projeto que a troca de stack afetou (RNF08, RNF09, RNF11, RNF12): ver o
   Changelog. A equipe decide como cada um fica na v2 do Documento de Requisitos.
