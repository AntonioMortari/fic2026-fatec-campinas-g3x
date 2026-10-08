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
| `axios` | cliente HTTP (instância única em `src/services/api.ts`) |
| `tailwindcss`, `@tailwindcss/vite` | estilização, com os tokens do design system |
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
public/
├── fonts/              Bitter servida localmente (sem Google Fonts)
└── images/             logotipo da ONG e fotos autorizadas
src/
├── main.tsx            provedores (leitura, React Query, roteador) e montagem
├── routes.tsx          mapa de rotas; /componentes só em desenvolvimento
├── styles.css          Tailwind + tokens do design system (@theme), alto contraste
├── components/
│   ├── ui/             peças: Button, TextField, PasswordField, Card, PageHeader,
│   │                   ListItem, DateBadge, Tabs, ChipFilter, EmptyState, StripedBand
│   └── layout/         moldura: Layout, FocusedLayout, Header, BottomBar, Menu,
│                       Footer, SkipLink
├── contexts/           preferências de leitura (A−/A/A+, alto contraste)
├── lib/                navegação, contatos da ONG, datas, validação de destino
├── pages/              uma tela por arquivo
├── services/           cliente da API e configuração do React Query
└── tests/              testes e preparação do ambiente de teste
```

## Design system

Baseado na "Análise UX/UI" do Claude Design. As regras de uso (um aplique por tela, ocre só em
ação e data, texto em rem…) estão no `CLAUDE.md` da raiz. Para ver cada componente:

```bash
npm run dev    # e abra http://localhost:5173/componentes
```
