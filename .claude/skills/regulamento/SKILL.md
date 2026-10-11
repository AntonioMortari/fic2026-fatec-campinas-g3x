---
name: regulamento
description: Confere se o repositório e o PR em andamento seguem exatamente o Regulamento Técnico do FIC 2026 (Anexos I, III, IV e V). Rodar antes de abrir CADA pull request, e de novo antes da entrega final.
---

# Conformidade com o Regulamento Técnico

Rode isto **antes de abrir cada PR** (e quando o usuário pedir `/regulamento`). O resultado vai no
corpo do PR, na seção "Conformidade com o regulamento". Não é opcional e não é só para o que o PR
toca: o regulamento diz que descumprir qualquer regra "pode resultar na desclassificação da equipe,
em qualquer etapa" (seção 11.3).

## Como executar

1. Descubra a etapa: **Etapa 5** (mentorias e desenvolvimento) ou **Etapa 6** (entrega final). Itens
   marcados *(Etapa 6)* só viram bloqueio na entrega; antes disso entram como **pendência**, nunca
   como "ok".
2. Passe pela lista abaixo. Para cada item, **rode o comando ou abra o arquivo** — não responda de
   memória. Registre `Atende`, `Diverge` (com o que falta) ou `Pendente (Etapa 6)`.
3. Se algo `Diverge`, corrija no próprio PR quando for do escopo dele; senão, diga em uma linha ao
   usuário e deixe registrado. Nunca marque `Atende` por parecer razoável.
4. Releia o diff do PR procurando o que ele pode ter quebrado (itens 1 a 7 abaixo).

## 1. Stack e estrutura (Anexo III, Anexo I 3.2, RNF-REP-06)

- Front-end React + Vite + TypeScript; back-end Node + Express (TypeScript); MySQL + Sequelize.
  Nenhum outro framework, ORM ou banco. `grep` nos `package.json` do PR.
- Raiz só com `README.md`, `AGENTS.md`/`CLAUDE.md`, `frontend/`, `backend/`, `docs/` (mais arquivos
  de configuração e de infraestrutura que não são pastas do projeto: `.github/`, `.claude/`,
  `docker-compose.yml`, `.gitignore`…). Pasta nova na raiz: parar e perguntar.
- `docs/` com `originais/`, `01_Requisitos/`, `02_Arquitetura/`, `03_Prototipos/`,
  `04_Gerencia_de_Mudancas/`, `05_Apresentacao/`.
- **`docs/originais/` intocada.** Conferir: `git log --oneline --diff-filter=MAD -- docs/originais`
  deve listar só o commit da cópia inicial; `git diff origin/main --stat -- docs/originais` vazio.
- Nome do repositório `fic2026-[fatec]-[equipe]`, minúsculas e hífens (RNF-REP-06). **O nome da equipe
  precisa ser o da inscrição** — hoje o repositório diz `g3x` e o pacote da submissão `G3Z`; não
  declarar `Atende` enquanto a equipe não confirmar.

## 2. Segurança (RNF-SEG-01 a 05, todos obrigatórios)

- JWT com rotas protegidas: toda rota nova de dado pessoal passa por `authenticate` (e `requireStaff`
  quando for do painel). Autorização mora nos services (sem RLS no MySQL) com teste de "outra pessoa".
- Senha só com hash (bcrypt); nunca em log, resposta ou teste que a grave em claro.
- Entrada validada por Zod (`validate` com `body`, `query`, `params`) em **toda** rota nova.
- CORS restrito a `CORS_ORIGINS`; nunca `*`.
- **Segredo fora do código versionado:** `git ls-files | grep -E '\.env$|\.pem|\.key'` deve devolver só
  `.env.example`; procurar chave, token ou senha real no diff. *Ponto em aberto:* `docker-compose.yml`
  traz `JWT_SECRET` e senhas de **desenvolvimento** escritos — aceitável só se continuar claramente
  marcado como "só local" e nunca for o valor de produção. Valor real de produção no repositório é
  `Diverge`, sempre.

## 3. Qualidade e documentação (RNF-QUA-01 a 06)

- **Swagger** em `/api-docs`: toda rota nova entra em `backend/src/docs/openapi.ts` no mesmo PR.
  Comparar `backend/src/routes/*.ts` com `openapi.ts`.
- **Testes do back-end** (obrigatório) para o que o PR adiciona: `cd backend && npm test`. Teste de
  front (recomendado): `cd frontend && npm test`.
- `npm run typecheck` e `npm run lint` verdes nas duas pastas.
- **README da raiz** (RNF-QUA-04): nome, equipe, problema e solução, tecnologias, setup local, URL do
  deploy, mapa de pastas com o caminho de cada artefato, inclusive `docs/originais/`. O PR que cria
  ou move artefato atualiza o mapa. *Hoje:* equipe e URL do deploy estão como "a preencher/a definir"
  → `Pendente (Etapa 6)`.
- **README de `frontend/` e `backend/`** (RNF-QUA-06): dependências, variáveis de ambiente, execução.
  Variável de ambiente nova ou comando novo entra no README da parte no mesmo PR.
- `AGENTS.md` com **uma linha por PR em que a IA produziu código** (data, ferramenta, escopo, PR e
  **quem da equipe revisou**). Coluna "Revisado por" vazia é `Diverge` do espírito da seção 11.2.

## 4. Back-end e front-end (RNF-BE-01 a 04, RNF-FE-01 a 05)

- REST com `routes → middlewares → controllers → services → models`; controller sem regra de
  negócio, service sem `req`/`res`.
- Acesso a dados **só por Sequelize**; sem `sequelize.query` cru fora de migration; tabela nova nasce
  por migration, nunca por `sync()`.
- `async/await` com erro tratado (formato único `{ erro: { codigo, mensagem } }`).
- TypeScript sem `any`, `@ts-ignore` ou `@ts-nocheck` em código de aplicação.
- Front: componentes funcionais reutilizáveis, estado por hooks/Context, **dados da API por React Query
  + Axios** (instância única em `services/api.ts`), rotas por `react-router-dom`, Tailwind. Nada de
  `fetch` solto, Redux ou biblioteca de UI.

## 5. Repositório e versionamento (RNF-REP-01 a 05)

- **RNF-REP-01 — repositório PRIVADO.** Conferir a visibilidade de verdade (GitHub:
  `search_repositories` com `repo:<dono>/<repo>` e ler `private`; ou Settings → General). Público é
  `Diverge`.
- RNF-REP-02: a `main` é o que está no deploy avaliado *(Etapa 6)*.
- RNF-REP-03: banca com acesso **Read** e convites aceitos *(Etapa 6)* — conferir em
  `list_repository_collaborators`; nunca dar Write/Admin à banca.
- **RNF-REP-04 — o histórico precisa evidenciar o trabalho da EQUIPE.** `git shortlog -sne origin/main`:
  um único autor numa equipe de 4–5 pessoas enfraquece a evidência. Avisar o usuário.
- RNF-REP-05: tag `entrega-final` (anotada), URL do repositório + nome da tag + SHA informados no
  formulário *(Etapa 6)*. `git tag -a entrega-final -m "Entrega da Versão Final - FIC 2026"`;
  `git rev-parse entrega-final`.
- Commits em Conventional Commits, em inglês, sem trailer de coautoria; branch `tipo/descricao-curta`
  sem prefixo de ferramenta.

## 6. Documentação técnica e gerência de mudanças (Anexo I 3.2, Anexo IV 2.2, 2.3, 2.5, 2.6)

- **Mudou User Story, critério de aceitação, arquitetura ou protótipo → entrada no `Changelog.md` no
  mesmo PR**: o que mudou, antes/depois, por quê, PR. Ajuste refina; **não altera a proposta aprovada**
  (problema, valor, escopo acordados com a ONG).
- Diferença em relação ao protótipo aprovado é "ajuste justificado e documentado", nunca abandono do
  design (Anexo IV 2.5): toda divergência de tela entra no Changelog com o motivo.
- Requisitos Não Funcionais obrigatórios **nunca** são alterados ou removidos — só ampliados.
- Antes da entrega *(Etapa 6)*: `docs/01_Requisitos/Documento_Requisitos_v2.pdf`,
  `docs/02_Arquitetura/Diagrama_Arquitetura_v2.md` **e** `.png`/`.svg` (Mermaid, com camadas, tecnologias,
  deploy e integrações), `docs/03_Prototipos/Prototipos_Interface_v2.pdf` (estático, offline),
  `docs/04_Gerencia_de_Mudancas/Changelog.pdf` (exportado do `.md`) e
  `docs/05_Apresentacao/Slides_Apresentacao.pdf`. O diagrama precisa descrever o que o código **de fato**
  implementa (Anexo IV 2.3).

## 7. Desempenho, deploy e acessibilidade (RNF-DES, RNF-DEP, Anexo IV §5)

- Interface responsiva (desktop e celular) e fluxos principais de ponta a ponta sem erro evidente: abrir
  a tela no Chromium a 390 e a 1440 px, **olhando**.
- **Deploy público em nuvem** (RNF-DEP-01/02) *(Etapa 6)*: URL no README, abrindo, com os fluxos
  principais funcionando; precisa de MySQL gerenciado e do `TRUST_PROXY` certo.
- Acessibilidade é critério de desempate: contraste, foco visível, teclado, rótulos associados, `alt`,
  HTML semântico, ARIA correto, leitor de tela, sem `vw` em texto.

## 8. Autoria e uso de IA (seções 11.1 e 11.2) — o ponto de maior risco

- A codificação é "estritamente exclusiva dos alunos"; IA é permitida como **apoio**. É **vedado o projeto
  agêntico** (AI-coded / zero-touch). Os alunos respondem por todo o código e precisam depurar, explicar,
  modificar e defender cada parte perante a banca.
- Todo PR em que a IA escreveu código tem linha em `AGENTS.md` com **revisor humano nomeado**. Se a
  coluna está vazia, diga isso ao usuário no relatório — não preencha o nome por ele.
- Ao terminar o PR, deixe no corpo "o que um integrante precisa saber explicar sobre esta mudança"
  (2 a 4 pontos). É o que a banca vai perguntar.

## Formato do relatório (corpo do PR)

```
## Conformidade com o regulamento
Etapa: 5 | 6
| Item | Resultado | Evidência |
|---|---|---|
| Stack/estrutura | Atende | … |
| Segurança (SEG-01..05) | Atende | … |
| Qualidade (QUA-01..06) | Diverge | Swagger sem a rota X |
| … | Pendente (Etapa 6) | … |
Divergências abertas: …
O que um integrante precisa saber explicar: …
```
