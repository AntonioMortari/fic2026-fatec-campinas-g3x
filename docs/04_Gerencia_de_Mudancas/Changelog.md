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
- **PR:** branch `feat/project-foundation`

## 2026-10-08 — Stack: de Next.js + Supabase para React + Express + MySQL
- **Artefato:** Arquitetura · Requisitos (não funcionais do projeto)
- **Antes:** Next.js com renderização no servidor sobre Supabase (PostgreSQL com RLS, Auth e
  Storage). A divergência em relação ao Anexo III estava declarada em
  `docs/originais/02_Documentacao_Tecnica/01_Requisitos/Documento_Requisitos.pdf`, seção 5
  (RNF-QUA-01, RNF-QUA-06, RNF-BE-02, RNF-FE-03 e RNF-REP-06), e desenhada em
  `docs/originais/02_Documentacao_Tecnica/02_Arquitetura/`.
- **Depois:** stack obrigatória do Anexo III — React + Vite + TypeScript no front-end,
  Node.js + Express + TypeScript no back-end, MySQL com Sequelize, monorepo com `frontend/` e
  `backend/`, Swagger em `/api-docs`.
- **Por quê:** conformidade com o Anexo III, exigida na etapa de mentorias e avaliada nos
  Artefatos (Anexo IV, 2.4).
- **O que isso muda em requisitos do projeto (seção 6 do documento original), ainda a reavaliar
  pela equipe:**
  - **RNF09 (proteção de dados):** a autorização deixa de morar no banco (RLS do PostgreSQL, que o
    MySQL não tem) e passa para a camada de services do back-end. Toda consulta a dado pessoal
    precisa filtrar por quem pede, e isso precisa de teste.
  - **RNF12 (funciona sem JavaScript) e RNF08 (lista de presença sem JavaScript):** uma aplicação
    React de página única não entrega a tela sem JavaScript. A garantia do documento original deixa
    de valer.
  - **RNF11 (nenhum framework de CSS):** passa a haver TailwindCSS, que o RNF-FE-05 cita como
    exemplo. O CSS gerado do design system base mede 23 KB (5,7 KB comprimido).
  - **RNF10 (custo de operação):** o banco MySQL precisa de hospedagem; a plataforma ainda não foi
    escolhida.
- **O que NÃO muda:** o problema, a proposta de valor e o escopo — os 9 Épicos e as 39 User
  Stories (RF01–RF39) do documento original.
- **PR:** branch `feat/project-foundation`

## 2026-10-08 — Protótipos: novo layout a partir da Análise UX/UI
- **Artefato:** Protótipos
- **Antes:** as capturas de `docs/originais/02_Documentacao_Tecnica/03_Prototipos/`, com o design
  system "Ateliê Afro" v1: cabeçalho e herói ocre, gaveta de navegação lateral, barra de
  acessibilidade fixa, botão flutuante de WhatsApp, sombra dura em quase todo bloco, rodapé longo
  com duas faixas listradas.
- **Depois:** o padrão das rodadas 1–5 da "Análise UX/UI" (Claude Design): creme domina e o ocre
  fica só em ação, estado ativo e data; elevação em 3 níveis com no máximo um aplique por tela;
  escala tipográfica maior (corpo 16px, H1 32px); campos de 52px; barra inferior no celular com
  "Apoiar" sempre visível; menu em folha que sobe de baixo, onde passam a morar o WhatsApp e os
  controles de leitura; cabeçalho creme com o logotipo; rodapé compacto com uma faixa só.
  Nesta etapa entram só a fundação visual e a estrutura (fases F1 e F2 do Plano de Migração);
  as telas vêm uma por PR.
- **Por quê:** o diagnóstico da análise sobre o layout v1 — navegação escondida atrás de 11 itens
  sem grupo, com "Apoiar" em 10º; cerca de 600px de ocre saturado antes do primeiro conteúdo;
  sombra em todo bloco, o que faz nada se destacar; corpo de 14,5px, abaixo do conforto de leitura
  no celular; quatro camadas flutuantes disputando a tela.
- **PR:** branch `feat/project-foundation`

## 2026-10-08 — RNF04: código em inglês, interface em português
- **Artefato:** Requisitos (não funcionais do projeto)
- **Antes:** o RNF04, "Idioma português", em
  `docs/originais/02_Documentacao_Tecnica/01_Requisitos/Documento_Requisitos.pdf` (seção 6):
  "Interface, código, tabelas e colunas em português", justificado pelo RNF07 (autonomia de
  manutenção).
- **Depois:** a interface, as mensagens para quem usa o site e a documentação continuam em
  português. O código, os nomes de arquivo, as tabelas e as colunas passam a ser em inglês.
- **Por quê:** decisão da equipe ao reconstruir o projeto na stack do Anexo III. O Regulamento
  Técnico não fixa idioma para o código.
- **O que fica em aberto:** o RNF07 (autonomia de manutenção pela ONG) era o argumento do RNF04;
  a equipe decide na v2 do Documento de Requisitos como ele fica.
- **PR:** branch `feat/project-foundation`

## 2026-10-09 — RF14 (Agenda pública): como a página passa a se comportar
- **Artefato:** Protótipos · Requisitos (RF14)
- **Antes:** `/agenda` com duas seções empilhadas ("Em breve" e "Já aconteceu"), texto de apoio "…basta
  preencher o formulário do evento", botões "Adicionar à agenda" e "Compartilhar" em cada evento e
  dados estruturados de evento (JSON-LD) para buscadores.
- **Depois:** abas Em breve / Já aconteceu, eventos agrupados por mês, filtro por tipo, próximo
  evento em destaque e "+ Agenda" (arquivo `.ics`), como nas telas 2b e 6b da Análise UX/UI. O texto
  de apoio é o do desenho ("…Para se inscrever não é preciso criar conta."), mais curto que o
  original: a frase "basta preencher o formulário do evento" promete uma tela que ainda não existe
  (RF15).
- **O que deixou de existir, e a equipe precisa decidir se volta:** o botão **Compartilhar** (não
  está no novo desenho) e os **dados estruturados para buscadores** (uma aplicação React de página
  única não os entrega no HTML; voltaria com pré-renderização ou com a geração no servidor).
- **O que o critério de aceitação continua exigindo, e foi testado:** o que ainda vem fica separado do
  que já passou; só o que ainda vem oferece inscrição; sem evento publicado aparece o estado vazio, e
  ele some quando há evento; datas no fuso de São Paulo.
- **Por quê:** adoção do novo padrão de página (sobretítulo → título → apoio) e do filtro por tipo
  definidos na Análise UX/UI.
- **PR:** branch `feat/agenda-page`
