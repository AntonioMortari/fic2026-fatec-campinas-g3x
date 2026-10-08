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

## Execução

```bash
npm install
cp .env.example .env        # e preencha
npm run db:migrate          # aplica as migrations pendentes
npm run dev                 # http://localhost:3333/api
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor com recarga automática |
| `npm run build` / `npm start` | compila para `dist/` e roda o compilado |
| `npm test` | testes (Jest + Supertest), sem precisar de banco |
| `npm run typecheck` | confere os tipos |
| `npm run db:migrate` / `db:migrate:undo` | aplica as pendentes / desfaz a última |

## Organização

```
src/
├── server.ts           abre a porta
├── app.ts              monta o Express (é o que os testes importam)
├── config/             variáveis de ambiente validadas e conexão com o banco
├── routes/             rotas REST, montadas sob /api
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

### Contratos da API

- Todo erro responde `{ "error": { "code", "message", "details"? } }`. O `code` é estável e é o que
  o front-end usa; a `message` é para gente ler, em português.
- Erro inesperado responde 500 sem mensagem interna nem pilha — essas vão para o log.
- Rotas protegidas esperam `Authorization: Bearer <token>`.
- Toda rota nova entra em `src/docs/openapi.ts` no mesmo PR.
- Tabelas nascem por migration, nunca por `sequelize.sync()`.
