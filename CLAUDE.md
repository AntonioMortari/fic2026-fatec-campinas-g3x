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
14. **Verificar olhando.** Teste verde não substitui abrir a tela.

## Backlog: Épicos, User Stories e Tasks

Segue o Anexo I, seção 2.2.1, e a trilha de Metodologias Ágeis:

- **Épico** (`EP-NN`) — objetivo amplo do produto, agrupa User Stories.
- **User Story** (`US-NN`) — "Como [perfil], quero [ação] para [benefício]", com **critérios de
  aceitação objetivos**. Vem do Documento de Requisitos.
- **Task** — desdobramento técnico de uma US, criada pela equipe **durante o desenvolvimento**
  (issue no GitHub ligada à US). Não faz parte do documento de requisitos.

Os identificadores de Épico e US são os do Documento de Requisitos (`docs/originais/` e, quando
evoluir, `docs/01_Requisitos/`). Não criar US que não esteja lá sem registrar no Changelog.

## Fluxo de trabalho

- A migração acontece **por Pull Requests contra a `main`**, um assunto por PR.
- Título do PR com a US quando houver: `[US-07] Inscrição em evento sem conta`.
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

## Status por módulo

Atualizado em 08/10/2026.

| Item | Status |
|---|---|
| Estrutura do repositório (Anexo I, 3.2) | **pronto** — pastas de `docs/` criadas vazias |
| Back-end base: Express, CORS, helmet, erro único, validação, JWT, bcrypt, Swagger | **pronto** — 22 testes Jest; `/api/saude` medido contra MySQL 8.4 real (200 com banco, 503 sem) |
| Migrations (Umzug) | **pronto** — `up`/`down` medidos contra MySQL real; nenhuma tabela ainda |
| Front-end base: Vite, React Router, React Query, Axios, Tailwind | **pronto** — 3 testes Vitest, build e lint ok; sem design system |
| Docker Compose (MySQL + API + front) | **escrito** — o MySQL subiu e foi usado; a imagem do back-end e a do front não foram construídas neste ambiente (o `npm ci` dentro do container não alcança o registro do npm daqui) |
| Design system (tokens, componentes, layout) | **falta** — aguardando os arquivos do Claude Design |
| `docs/originais/` | **falta** — aguardando o .zip da Submissão Institucional |
| Funcionalidades do site e do painel | **falta** — migrar de `venturus-atelie` por US |
| Deploy | **falta** |

## Pendências que dependem de gente

1. Arquivos do Claude Design (`Analise UX-UI`, `Plano de Migracao`) — base do design system.
2. O .zip da Submissão Institucional, para `docs/originais/`.
3. Nomes e papéis da equipe no `README.md` e o revisor na tabela do `AGENTS.md`.
4. Plataforma de deploy (o regulamento não impõe; precisa de MySQL gerenciado).
