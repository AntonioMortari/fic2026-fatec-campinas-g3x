# AGENTS.md — uso de IA e instruções para agentes

Este arquivo atende ao **item 11.2 do Regulamento Técnico** do FIC 2026 (transparência no uso de
Inteligência Artificial) e ao **RNF-QUA-05**. Ele tem duas partes: o registro de como a equipe usa
IA, e as regras que qualquer agente de código precisa seguir neste repositório.

## 1. Registro do uso de IA

O regulamento permite e incentiva IA generativa como apoio, com três limites:

- **Sem projeto agêntico.** O desenvolvimento não é delegado integralmente a agentes autônomos.
- **Domínio técnico.** A equipe é responsável por todo o código e precisa saber depurar, explicar,
  modificar e defender cada parte diante da banca e dos mentores.
- **Transparência.** O escopo e o modo de uso ficam documentados aqui, para rastreabilidade.

O uso de IA é registrado **neste arquivo**, e não em cada commit. Toda entrada diz a ferramenta, o
que ela fez, e quem da equipe revisou e respondeu pelo resultado.

| Data | Ferramenta | Escopo | PR | Revisado por |
|---|---|---|---|---|
| 08/10/2026 | Claude Code (Anthropic) | Estrutura inicial do monorepo conforme o Anexo I/III do regulamento: esqueleto do back-end (Express, Sequelize, middlewares de validação, JWT e erro, Swagger, testes) e do front-end (Vite, React Router, React Query, Axios, Tailwind), Docker Compose e READMEs | `feat/project-foundation` | _a preencher_ |
| 08/10/2026 | Claude Code (Anthropic) | Cópia dos originais para `docs/originais/`; design system base no front-end (tokens no Tailwind, componentes, cabeçalho, barra inferior, menu em folha, rodapé) a partir da "Análise UX/UI" e do "Plano de Migração" do Claude Design; entradas do Changelog | `feat/project-foundation` | _a preencher_ |
| 08/10/2026 | Claude Code (Anthropic) | Passagem do código e dos nomes de arquivo para inglês, remoção de comentários dispensáveis, histórico refeito em Conventional Commits | `feat/project-foundation` | _a preencher_ |

**Como registrar uma nova entrada:** uma linha por PR em que a IA produziu código, documentação ou
decisão de arquitetura. Uso pontual (tirar uma dúvida, explicar um erro) não precisa de linha.

## 2. Instruções para agentes de código

Valem para qualquer assistente (Claude Code, Copilot, Cursor, etc.). O guia completo do projeto —
arquitetura, comandos, status — está em `CLAUDE.md`.

1. **A stack é obrigatória** (Anexo III): React + Vite + TypeScript no front-end, Node.js + Express +
   TypeScript no back-end, MySQL com Sequelize. Não introduzir outro framework, ORM ou banco.
2. **A estrutura do repositório é obrigatória** (Anexo I, seção 3.2): `frontend/`, `backend/` e
   `docs/` com as pastas numeradas. Não criar pastas novas na raiz sem decisão da equipe.
3. **`docs/originais/` nunca é editada.** É a cópia congelada da Submissão Institucional.
4. **Os RNFs obrigatórios não podem ser alterados nem removidos** — só ampliados.
5. **Nunca inventar conteúdo da ONG.** Sem lorem ipsum, sem evento, depoimento ou número fictício.
   Faltou texto real, a pergunta vai para a equipe.
6. **Segredo nunca entra no código** (RNF-SEG-05). Só em variável de ambiente.
7. **Commits em Conventional Commits** (`feat(frontend): ...`, `fix(backend): ...`), em inglês.
   Sem trailers de coautoria (`Co-Authored-By` e semelhantes) — o uso de IA é registrado na
   tabela acima. **Branches** `tipo/descricao-curta`, sem prefixo de ferramenta.
8. **Código e nomes de arquivo em inglês**; interface e documentação em português.
9. **Comentário só quando é estritamente necessário** — o porquê que o código não diz.
10. **Toda mudança que altera requisito, arquitetura ou protótipo** ganha uma entrada em
    `docs/04_Gerencia_de_Mudancas/Changelog.md` no mesmo PR.
11. **Rodar os testes antes de propor o PR**: `npm test` e `npm run typecheck` em `backend/` e em
    `frontend/`.
