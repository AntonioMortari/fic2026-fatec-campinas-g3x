# Gerência de Mudanças — Changelog

Registro formal das mudanças nos artefatos de desenvolvimento desde a Submissão Institucional
(Regulamento Técnico, seção 9 e Anexo IV, bloco 2.6). A versão entregue é exportada para
`Changelog.pdf` nesta mesma pasta.

**O que entra aqui:** toda mudança em User Story, critério de aceitação, diagrama de arquitetura ou
protótipo — o que mudou, por quê, e onde. Ajustes refinam a implementação; **não alteram a proposta
aprovada** (o problema, a proposta de valor e o escopo acordados com a ONG).

**Formato de cada entrada:**

```
## AAAA-MM-DD — título curto
- **Artefato:** Requisitos | Arquitetura | Protótipos | Repositório
- **Antes:** o que dizia a versão anterior (com referência a docs/originais/ quando for o caso)
- **Depois:** o que passou a dizer
- **Por quê:** o aprendizado ou obstáculo do desenvolvimento que motivou a mudança
- **PR:** link
```

---

## 2026-10-08 — Estrutura inicial do repositório
- **Artefato:** Repositório
- **Antes:** não havia repositório de desenvolvimento para a etapa de mentorias.
- **Depois:** monorepo `fic2026-fatec-campinas-g3x` com `frontend/`, `backend/` e `docs/`, na
  estrutura do Anexo I, seção 3.2, e com a stack obrigatória do Anexo III.
- **Por quê:** início da etapa 5 (Rituais de Desenvolvimento e Mentorias Exclusivas).
- **PR:** estrutura base
