# Back-end — API do Ateliê Afro Cultural

API REST em **Node.js + Express 5 + TypeScript**, com **MySQL** via **Sequelize**.

## Dependências

- Node.js 22+
- MySQL 8 (o `docker compose` da raiz sobe um)

| Pacote | Para quê |
|---|---|
| `express`, `cors`, `helmet` | servidor HTTP, CORS restrito ao front-end, cabeçalhos de segurança |
| `sequelize`, `mysql2`, `umzug` | ORM, driver do MySQL e executor de migrations |
| `zod` | validação da entrada das rotas e das variáveis de ambiente |
| `jsonwebtoken`, `bcryptjs` | autenticação por JWT e hash de senha |
| `swagger-ui-express` | documentação da API em `/api-docs` |
| `jest`, `@swc/jest`, `supertest` | testes automatizados |
| `tsx`, `typescript` | execução em desenvolvimento e compilação |

## Variáveis de ambiente

Copie `.env.example` para `.env` e preencha. **O `.env` nunca vai para o Git.** A API não sobe se
alguma obrigatória faltar ou for inválida — o erro diz qual.

| Variável | Obrigatória | Descrição |
|---|---|---|
| `NODE_ENV` | não | `development` (padrão), `test` ou `production` |
| `PORT` | não | porta HTTP (padrão `3333`) |
| `CORS_ORIGINS` | sim | origens do front-end liberadas no CORS, separadas por vírgula |
| `DB_HOST`, `DB_PORT` | sim / não | endereço do MySQL (porta padrão `3306`) |
| `DB_NAME`, `DB_USER`, `DB_PASSWORD` | sim | banco e credenciais |
| `JWT_SECRET` | sim | chave de assinatura do JWT, mínimo de 32 caracteres |
| `JWT_EXPIRES_IN` | não | validade do token (padrão `1h`) |
| `TRUST_PROXY` | não | quantos proxies há entre a internet e a API (padrão `0`). **No deploy, precisa ser o número certo**: com `0` atrás de um proxy todo visitante parece ter o IP do proxy e o limite de inscrições por conexão vira um balde só; alto demais, o IP pode ser forjado pelo cabeçalho `X-Forwarded-For` |

## Execução

```bash
npm install
cp .env.example .env        # e preencha
npm run db:migrate          # aplica as migrations pendentes
npm run db:seed             # cria as contas de teste (admin@atelie.local e usuario@atelie.local, senha senha-dev-123)
npm run dev                 # http://localhost:3333/api
```

Sem rodar `db:migrate` antes, a API sobe mas toda rota que lê uma tabela responde 500
(`Table '…' doesn't exist` no log). No Docker Compose isso é feito sozinho a cada subida.

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor com recarga automática |
| `npm run build` / `npm start` | compila para `dist/` e roda o compilado |
| `npm test` | testes (Jest + Supertest), sem precisar de banco |
| `npm run test:db` | testes de integração contra um MySQL de verdade (ver abaixo) |
| `npm run typecheck` | confere os tipos |
| `npm run db:migrate` / `db:migrate:undo` | aplica as pendentes / desfaz a última |
| `npm run db:seed` | cria (ou restaura) as duas contas de teste; só roda em banco local e fora de produção |

### Testes de integração

`npm test` não usa banco. Os de `tests/integration/` rodam contra um MySQL real e só entram com
`npm run test:db`, num banco só para teste (as migrations são aplicadas nele pelo próprio teste):

```bash
docker compose exec db mysql -uroot -proot-dev -e "create database atelie_test character set utf8mb4; grant all on atelie_test.* to 'atelie'@'%';"
DB_HOST=127.0.0.1 DB_NAME=atelie_test DB_USER=atelie DB_PASSWORD=atelie-dev npm run test:db
```

Ao inserir dados à mão pelo cliente `mysql`, use `--default-character-set=utf8mb4`: sem isso os
acentos são gravados duas vezes codificados ("CafÃº") e o banco guarda lixo sem avisar.

## Organização

```
src/
├── server.ts           abre a porta
├── app.ts              monta o Express (é o que os testes importam)
├── config/             variáveis de ambiente validadas e conexão com o banco
├── routes/             rotas REST, montadas sob /api
├── validators/         esquemas Zod de entrada, um arquivo por módulo (as rotas os passam ao validate)
├── controllers/        lê a requisição e escreve a resposta — sem regra de negócio
├── services/           regras de negócio, autorização e acesso aos models
├── models/             models do Sequelize e suas associações
├── middlewares/        validate (Zod), authenticate (JWT), error-handler
├── database/           executor (migrate.ts) e arquivos de migration
├── docs/openapi.ts     documento do Swagger
└── utils/              ApiError, hash de senha, token
tests/                  Jest + Supertest
```

O fluxo de uma requisição é sempre `routes → middlewares → controller → service → model`.

### Rotas

| Rota | O que faz |
|---|---|
| `GET /api/health` | API e banco respondendo |
| `GET /api/events?period=upcoming\|past&limit=` | eventos **publicados**; `upcoming` do mais próximo ao mais distante, `past` do mais recente ao mais antigo |
| `GET /api/events/:id` | um evento publicado, com `requiresCpf`, `spotsLeft` e `registrationsOpen` (o que o formulário de inscrição precisa) |
| `POST /api/events/:id/registrations` | inscreve alguém, **com ou sem conta** (RF15). Com token, liga a inscrição à conta; token ruim dá 401. Vaga conferida no banco com a linha do evento travada; CPF só se o evento pede; responsável obrigatório para menor; 409 `event_full`/`registrations_closed`/`already_registered`; 429 acima de 5 pessoas por e-mail no evento ou de 30 inscrições por hora vindas da mesma conexão (o IP nunca é gravado, só um HMAC) |
| `GET /api/events/:id/calendar.ics` | o evento como arquivo de calendário; 404 se não existe ou não está publicado |
| `POST /api/auth/register` | cria a conta e já devolve `{ token, user }` (201). 400 sem maioridade (RN01), sem consentimento ou sem ao menos uma forma de participar; 409 `email_taken` se o e-mail já existe |
| `POST /api/auth/login` | `{ token, user }`; 401 `invalid_credentials` com a mesma frase para e-mail inexistente e senha errada |
| `POST /api/auth/refresh` | troca o cookie `af_refresh` (httpOnly) por `{ token, user }` novos e **gira** o cookie. 401 sem cookie, expirado, já usado (após 10 s de tolerância, apaga todas as sessões da conta) ou conta apagada. Exige `X-Requested-With` |
| `POST /api/auth/logout` | apaga o cookie de renovação no banco e no navegador; sempre 204. Exige `X-Requested-With` |
| `GET /api/admin/events` · `GET /api/admin/events/:id` | **só equipe**: todos os eventos, rascunhos incluídos |
| `POST /api/admin/events` · `PUT /api/admin/events/:id` | **só equipe**: cria (sempre rascunho) e corrige um evento. Data e hora como `2026-11-20T15:00`, lidas no horário de São Paulo; limite de vagas e `requiresCpf` opcionais. Não aceitam `published` |
| `PATCH /api/admin/events/:id/publication` | **só equipe**: `{ "published": true \| false }`, o único caminho que publica ou tira do ar. Não existe `DELETE` |
| `GET /api/admin/events/:id/registrations` · `.csv` | **só equipe** (RF16): inscritos com contato, CPF, responsável e autorização de imagem; a planilha usa `;`, BOM UTF-8 e neutraliza fórmulas. Só leitura, sem cache |
| `GET /api/admin/report` · `/report/csv` | **só equipe** (RF30–32): números do período (`period` = `month`/`quarter`/`semester`, `offset` 0, -1…) e as atividades, com veio / faltou / sem conferir; contagem que falhou vem `null`, nunca 0. Só números, sem dado pessoal; as canceladas ficam de fora |
| `GET /api/admin/events/:id/attendance` · `PATCH …/attendance/:registrationId` | **só equipe** (RF17): lista de presença (nome, menor de idade e a marca, sem contato) e `{ "attended": true \| false \| null }`; `null` desmarca. A planilha ganha a coluna "Presença" |
| `GET` · `POST /api/registrations/cancel/:code` | **aberta, sem sessão**: mostra e cancela a inscrição do link pessoal (UUID entregue a quem se inscreveu). Só devolve o evento e o nome abreviado. A linha fica como registro e deixa de contar; 409 `already_cancelled` / `registrations_closed` |
| `POST /api/contacts` | **aberta, sem sessão** (RF07): mensagem do formulário de contato (`name`, `email`, `message`, `consent` obrigatórios; `phone` e `institution` opcionais). Responde só `{ "received": true }`. Até 30 mensagens por hora por conexão (`429 too_many_requests`); o IP nunca é gravado. A leitura é só da equipe, em `/api/admin/contacts`; o corpo nunca define situação nem nota |
| `PATCH /api/me` | **conta logada** (RF11): altera `name`, `phone` e `personType` da conta do token. E-mail, senha e papéis não mudam por aqui, seja qual for o corpo |
| `GET /api/me/registrations` | **conta logada** (RF11): as inscrições ligadas à conta do token, com o evento e o `cancelCode`; `attendanceRecorded` só é verdadeiro quando a equipe marcou presença |
| `GET /api/volunteer-areas` | **aberta** (RF24): as cinco áreas de voluntariado, com o texto de cada uma, na ordem da ONG |
| `POST /api/volunteer-applications` | **conta logada** (RF25): candidata a conta do token (nunca do corpo; o corpo só tem `areas` e `message`, até 2000 caracteres). Candidatura e áreas numa transação; 409 `already_applied` enquanto houver uma `new`, `in_contact` ou `volunteering` (regra também no banco, por índice único); `ended` libera outra. Áreas repetidas viram uma, área inexistente ou lista vazia é 400 no campo `areas` |
| `GET /api/me/volunteer-applications` | **conta logada** (RF11): só as candidaturas da conta do token, as vivas primeiro e as encerradas depois, com as áreas |
| `GET /api/admin/volunteer-applications` · `/counts` · `/export.csv` · `/:id` | **só equipe** (RF26): a fila com nome, e-mail e telefone do perfil, filtros `status` e `area` por query e `counts` por situação; `/counts` devolve só as contagens; a planilha segue os mesmos filtros (`;`, BOM, fórmula neutralizada) |
| `PATCH /api/admin/volunteer-applications/:id/status` | **só equipe** (RF26): `{ "status": "new" \| "in_contact" \| "volunteering" \| "ended" }`, o único campo que o corpo aceita; qualquer passagem existe; reabrir uma encerrada quando a pessoa já tem outra viva é 409 `live_application_exists` |
| `GET /api/admin/contacts` · `/counts` · `/export.csv` · `/:id` | **só equipe** (RF29): a fila de mensagens do formulário de contato, filtro `status`, `page` e `pageSize` (padrão 20, até 100) e `counts` por situação; ordem nova, em contato, concluída e, dentro de cada uma, a mais recente primeiro, cortada no SQL; a planilha traz tudo do filtro (`;`, BOM, fórmula neutralizada). Nunca devolve o hash de origem |
| `PATCH /api/admin/contacts/:id` | **só equipe** (RF29): `{ "status"?, "staffNote"? }` (ao menos um; nota até 2000 caracteres, vazia apaga). Grava só essas duas colunas; **não há DELETE nem POST**: a mensagem é registro |
| `GET /api/auth/me` | a ficha de quem está autenticado; 401 sem token válido, ou se a conta foi apagada |

### Contratos da API

- Todo erro responde `{ "error": { "code", "message", "details"? } }`. O `code` é estável e é o que
  o front-end usa; a `message` é para gente ler, em português.
- Erro inesperado responde 500 sem mensagem interna nem pilha — essas vão para o log.
- Rotas protegidas esperam `Authorization: Bearer <token>`.
- Nenhum campo de papel entra pelo corpo: o cadastro lista as colunas uma a uma e `is_staff` nasce
  `false`. Quem vira equipe é promovido à mão no banco (`update users set is_staff = true where email = '…'`).
- Equipe é a coluna `users.is_staff`, lida do banco a cada requisição. Para promover alguém: `update users set is_staff = true where email = '…';` — não há rota para isso, de propósito.
- As rotas `/auth` respondem com `Cache-Control: no-store`.
- O CORS aceita credenciais só das origens de `CORS_ORIGINS`. `REFRESH_TOKEN_DAYS` (padrão 7) e `COOKIE_SAMESITE` (`lax`, `strict` ou `none`; `none` força `Secure`) configuram o cookie.
- Toda rota nova entra em `src/docs/openapi.ts` no mesmo PR.
- Tabelas nascem por migration, nunca por `sequelize.sync()`.
