# Front-end — Ateliê Afro Cultural

Aplicação **React** criada com **Vite**, em **TypeScript**, estilizada com **TailwindCSS**.

## Dependências

- Node.js 22+
- A API do `backend/` rodando (ou o `docker compose` da raiz)

| Pacote | Para quê |
|---|---|
| `react`, `react-dom` | interface |
| `react-router-dom` | navegação entre telas |
| `@tanstack/react-query` | cache e estado das consultas à API |
| `axios` | cliente HTTP (instância única em `src/servicos/api.ts`) |
| `tailwindcss`, `@tailwindcss/vite` | estilização |
| `vitest`, `@testing-library/react`, `jsdom` | testes |
| `oxlint` | lint |

## Variáveis de ambiente

Copie `.env.example` para `.env.local`. Toda variável `VITE_` vai parar no JavaScript que o
navegador baixa — **nunca coloque segredo aqui**.

| Variável | Descrição |
|---|---|
| `VITE_API_URL` | endereço da API, ex.: `http://localhost:3333/api` |

## Execução

```bash
npm install
cp .env.example .env.local
npm run dev                 # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | servidor de desenvolvimento |
| `npm run build` | confere os tipos e gera `dist/` |
| `npm test` | testes (Vitest + Testing Library) |
| `npm run lint` | lint (oxlint) |
| `npm run typecheck` | confere os tipos |

## Organização

```
src/
├── main.tsx            provedores (React Query, roteador) e montagem
├── rotas.tsx           mapa de rotas
├── estilos.css         Tailwind e tokens do design system
├── componentes/        componentes reutilizáveis (Layout, ...)
├── paginas/            uma tela por arquivo
├── servicos/           cliente da API e configuração do React Query
└── testes/             testes e preparação do ambiente de teste
```
