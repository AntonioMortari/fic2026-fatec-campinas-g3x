# Ateliê Afro Cultural — FIC 2026

Sistema web do **Ateliê Afro Cultural**, espaço educativo de criação, reflexão e valorização da
cultura e memória afro-brasileira na Casa Verde, zona norte de São Paulo. Projeto da equipe **g3x**
da **Fatec Campinas** no Fatec Innovation Challenge 2026.

> **Deploy:** _a definir_ — a URL pública entra aqui quando a aplicação for publicada (RNF-DEP-01).

## Equipe

| Integrante | Papel |
|---|---|
| _a preencher_ | Front-end |
| _a preencher_ | Back-end |
| _a preencher_ | Agilista |
| _a preencher_ | DevOps |

## O problema e a solução

O Ateliê é uma organização de **arte, cultura e identidade do povo negro** — não de assistência
social. A equipe da ONG é pequena e não tem computador próprio: toda a operação acontece no celular
pessoal de quem trabalha lá, muitas vezes de pé, no meio de um evento.

A solução é um site institucional com painel de gestão pelo celular: apresentar a organização, seus
projetos e sua agenda; receber contatos, inscrições em eventos, candidaturas de voluntariado e
ofertas de doação; e dar à equipe um painel para publicar e organizar tudo isso.

A descrição completa está na Proposta de Impacto (`docs/originais/01_Proposta/`), e o escopo
funcional no Documento de Requisitos (`docs/01_Requisitos/`).

## Tecnologias

| Camada | Stack |
|---|---|
| Front-end | React + Vite + TypeScript, TailwindCSS (com os tokens do design system), React Router, React Query, Axios |
| Back-end | Node.js + Express + TypeScript, JWT, bcrypt, Zod, Swagger |
| Banco de dados | MySQL 8.4 com Sequelize (migrations com Umzug) |
| Testes | Jest + Supertest (back-end), Vitest + Testing Library (front-end) |
| Ambiente local | Docker Compose |

## Setup local

Pré-requisitos: **Docker** com Docker Compose, ou **Node.js 22+** e um MySQL 8.

### Com Docker (recomendado)

```bash
docker compose up --build    # MySQL, API e front-end; as tabelas são criadas sozinhas
```

O backend aplica as migrations pendentes toda vez que sobe. Para desfazer a última:
`docker compose exec backend npm run db:migrate:undo`.

| Serviço | Endereço |
|---|---|
| Front-end | http://localhost:5173 |
| API | http://localhost:3333/api |
| Documentação da API (Swagger) | http://localhost:3333/api-docs |
| Saúde da API e do banco | http://localhost:3333/api/health |

### Sem Docker

Cada parte tem o seu README com dependências, variáveis de ambiente e comandos:
[`backend/README.md`](backend/README.md) e [`frontend/README.md`](frontend/README.md).

## Mapa do repositório

```
.
├── README.md                  este arquivo — porta de entrada
├── AGENTS.md                  uso de IA no projeto e instruções para agentes (RNF-QUA-05)
├── docker-compose.yml         ambiente de desenvolvimento local
├── frontend/                  aplicação React (README próprio)
├── backend/                   API REST Express (README próprio)
└── docs/
    ├── originais/             cópia INALTERADA do .zip da Submissão Institucional
    │   ├── LEIA-ME.md                    guia do pacote, como foi entregue
    │   ├── 01_Proposta/                  Proposta_Impacto.pdf
    │   ├── 02_Documentacao_Tecnica/
    │   │   ├── 01_Requisitos/            Documento_Requisitos.pdf
    │   │   ├── 02_Arquitetura/           Diagrama_Arquitetura.md / .mmd / .png
    │   │   └── 03_Prototipos/            index.html (abre offline) + telas/
    │   └── 03_Video_Defesa/              Link_Video.txt
    ├── 01_Requisitos/         Documento de Requisitos atualizado (v2)
    ├── 02_Arquitetura/        Diagrama de Arquitetura atualizado (v2, Mermaid + imagem)
    ├── 03_Prototipos/         Protótipos de interface atualizados (v2)
    ├── 04_Gerencia_de_Mudancas/  Changelog — o que mudou desde a submissão e por quê
    └── 05_Apresentacao/       slides da Grande Final
```

`docs/originais/` **nunca é editada**: ela é o ponto de comparação entre a proposta e o resultado.
A evolução dos artefatos acontece nas pastas numeradas de `docs/`.

## Testes

```bash
cd backend && npm test     # Jest + Supertest
cd frontend && npm test    # Vitest + Testing Library
```
