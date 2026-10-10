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
| 09/10/2026 | Claude Code (Anthropic) | Agenda pública (RF14): tabela, model, API de eventos e exportação `.ics` no back-end; página, filtro, abas e ligação da home à API no front-end; correção do healthcheck do MySQL no Docker Compose | `feat/agenda-page` | _a preencher_ |

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
| 09/10/2026 | Claude Code (Anthropic) | Cadastro e login (RF08, RF10, RF12): migration, model, service e rotas de autenticação com testes unitários e de integração; sessão com token de acesso em memória e renovação por cookie httpOnly, formulários, rota protegida, cabeçalho e menu no front-end; ajuste no `docker-compose.yml` para aplicar as migrations ao subir | `feat/auth` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Cadastro e edição de eventos pela equipe (RF13): coluna `requires_cpf`, leitura de data e hora no fuso de São Paulo, middleware que consulta o banco para exigir equipe, rotas `/api/admin/events`; painel (`/admin`, lista, formulário) no front-end; correção do cabeçalho a 320px com A+ | `feat/events-admin` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Moldura própria do painel da equipe conforme a tela 2c: cabeçalho escuro, barra inferior do painel, home com ações rápidas, menu "Mais" com a conta primeiro; 404 do painel dentro da moldura pública | `feat/admin-shell` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Cor de erro do design system (tokens, ícone, campo, aviso, estado de falha e aviso fixo) como padrão para os próximos formulários | `feat/error-color` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Seed de desenvolvimento com uma conta de equipe e uma comum, travada contra produção e contra banco remoto; ligada ao `docker compose up` | `feat/dev-seed` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Inscrição em evento com e sem conta (RF15): tabela, vaga conferida com a linha do evento travada, CPF condicional, responsável de menor, limite por e-mail; formulário, vagas restantes na agenda e na home | `feat/event-registration` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Consulta de inscritos pela equipe (RF16): lista e planilha CSV com autorização de imagem em toda linha, tela no painel; limite de 30 inscrições por hora por conexão, com HMAC do IP e `TRUST_PROXY` | `feat/registrations-admin` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Lista de presença pelo celular (RF17) com três estados e marca otimista, coluna "Presença" na planilha, e "Minhas inscrições" na área do usuário (RF11); migration `attended`, rotas `/admin/events/:id/attendance` e `/me/registrations` | `feat/attendance-my-registrations` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Moldura desktop do painel (cabeçalho creme e menu lateral, desenho 7j) e lista de presença refeita conforme o desenho 3g (grupos, progresso, "Desfazer", nome abreviado, telefone mascarado) | `feat/panel-desktop-attendance` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Cancelar inscrição pelo link pessoal, sem conta (desenhos 7c e 7d): migration com `cancelled_at`, `cancel_code` e índice único que libera nova inscrição; rotas abertas, tela de confirmação e de "Feito"; canceladas fora de todas as contagens | `feat/cancel-registration` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Minha conta conforme o desenho 7a e tela própria para alterar nome, telefone e tipo (7b): `PATCH /api/me` com três colunas escritas à mão, controle segmentado, aviso de "atualizados" uma vez | `feat/account-edit` | _a preencher_ |
| 09/10/2026 | Claude Code (Anthropic) | Relatório do painel conforme os desenhos 7i e 7j: janelas de 1/3/6 meses, totais, tabela por atividade, planilha e impressão em PDF; sem os números de voluntários, doadores e valor, que dependem de módulos que não existem | `feat/report` | _a preencher_ |
| 10/10/2026 | Claude Code (Anthropic) | Revisão de fidelidade ao desenho: Entrar no celular e no desktop (3f, 8b), menu "Mais" em painel no desktop (8a) e agenda no desktop (6b) com a coluna lateral; ajustes compartilhados de escala tipográfica, cabeçalho, rodapé, selo de data, campo e botão | `fix/design-fidelity` | _a preencher_ |
| 10/10/2026 | Claude Code (Anthropic) | Lado esquerdo do Entrar no desktop conforme o desenho 8b (texto e lista numerada) e menu "Mais" aberto ao passar o mouse | `fix/login-left-menu-hover` | _a preencher_ |
