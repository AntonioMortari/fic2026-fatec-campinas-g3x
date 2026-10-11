## Cards do Trello

<!-- Cole o endereço de cada card (https://trello.com/c/xxxxxxxx). Ao abrir a PR o card é vinculado e vai para "Em revisão"; ao mesclar, vai para "Feito". -->

- 

## O que muda

<!-- User Stories (RFxx) cobertas e como foi verificado. -->

## Conformidade com o regulamento

<!-- Rodar `/regulamento` (.claude/skills/regulamento/SKILL.md) e colar o resumo. -->

- [ ] Stack e estrutura de pastas respeitadas; `docs/originais/` intocada
- [ ] Segurança: rota nova com JWT, validação Zod e CORS; nenhum segredo no diff
- [ ] Swagger (`openapi.ts`) com as rotas novas; testes do back-end para o que entrou
- [ ] `npm test`, `npm run typecheck` e `npm run lint` verdes em `backend/` e `frontend/`
- [ ] README (raiz, `frontend/`, `backend/`) atualizado se mudou setup, variável ou artefato
- [ ] `Changelog.md` atualizado se mudou User Story, arquitetura ou protótipo
- [ ] Linha em `AGENTS.md` com o **revisor humano** se a IA escreveu código neste PR
- [ ] Tela conferida no navegador a 390 e a 1440 px (sem rolagem lateral, alvos de 44px)
- [ ] Repositório continua privado e os commits seguem Conventional Commits, sem coautoria

**Divergências abertas:** <!-- nenhuma | lista -->

**O que um integrante precisa saber explicar sobre esta mudança:**

-
