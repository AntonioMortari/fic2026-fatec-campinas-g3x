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

## 2026-10-09 — RF08, RF10 e RF12 (cadastro, login e maioridade): o que muda na troca de stack
- **Artefato:** Requisitos (RF08, RF10, RF12)
- **Antes:** os critérios diziam que cadastro, entrada, recuperação e "Sair" funcionam **sem
  JavaScript**, que a sessão é verificada no servidor de autenticação (Supabase) e que ela se renova
  sozinha.
- **Depois:** a interface é uma aplicação React (Anexo III) e o back-end é uma API REST com JWT.
  - "Sem JavaScript" **deixa de valer**: não existe formulário que funcione sem script numa aplicação
    de página única. A verificação passa a ser que o servidor recusa tudo o que o navegador deixaria
    passar (maioridade, consentimento, papel de equipe) — testado no back-end com corpo montado à mão.
  - A sessão tem duas peças: um JWT de acesso de 1 hora **só na memória** da página, e um token de
    renovação de 7 dias num cookie `httpOnly` (no banco guarda-se só o hash), trocado a cada uso. Recarregar
    a página mantém a sessão; sair a encerra no servidor. Nenhum token fica em `localStorage`.
  - O papel de equipe segue sem entrar pelo cadastro; o esquema Zod descarta o campo e a coluna nasce
    `false` (critério de RF08 mantido, e mais forte: há teste contra o MySQL real).
  - Maioridade (RN01) e consentimento ficam gravados como **data e hora**, e não como um booleano.
  - **RF10 fica parcial:** a recuperação de senha não está nesta entrega, porque depende de enviar
    e-mail e o provedor ainda não foi escolhido.
- **Por quê:** a troca de stack do regulamento tira o Supabase Auth e o Next.js, que davam esses
  comportamentos de graça.
- **PR:** branch `feat/auth`

## 2026-10-09 — RF13 (Cadastro e edição de eventos): a coluna de documento e a regra de fuso
- **Artefato:** Requisitos (RF13) · Arquitetura
- **Antes:** o critério diz que o evento aceita "limite de vagas e a exigência de documento, os dois
  opcionais" e que "data e hora são interpretadas no fuso da organização"; a tabela `events` só tinha
  o limite de vagas.
- **Depois:** nova coluna `events.requires_cpf` (booleana, padrão `false`). Data e hora chegam do
  formulário como horário de parede, sem fuso (`2026-11-20T15:00`), e **o servidor** as interpreta no
  fuso de São Paulo pelas regras do `Intl`, nunca pelo fuso do aparelho. As rotas de equipe ficam em
  `/api/admin/events`, atrás de uma checagem que consulta o banco a cada requisição. Salvar não publica
  (o campo `published` não existe nos esquemas de criação e edição) e não há rota para apagar.
- **O que continua igual ao critério:** publicar é um botão separado; a tela não apaga evento.
- **O que o critério não cobria e foi decidido aqui:** o painel responde **404** na tela a quem não é
  equipe (a API responde 403); o "Desfazer" no aviso de publicar/tirar do ar substitui uma tela de
  confirmação, porque os dois gestos se desfazem sozinhos.
- **Fora desta entrega:** foto do evento e lista fechada de tipos (hoje texto livre).
- **Por quê:** o projeto de origem guardava essas travas na RLS do banco; no MySQL elas moram no
  back-end.
- **PR:** branch `feat/events-admin`

## 2026-10-09 — Painel da equipe: moldura da tela 2c, sem as pendências que ainda não existem
- **Artefato:** Protótipos (tela 2c, "Painel da equipe")
- **Antes:** o painel (RF13) vivia dentro do cabeçalho, da barra inferior e do rodapé do site público,
  com uma home que era só uma lista de uma linha.
- **Depois:** moldura própria como na 2c — cabeçalho escuro "Painel · Ateliê Afro" com "Ver o site",
  barra inferior do painel e home com "Ações rápidas" e "Todas as telas". "Mais" abre o menu em folha com
  "Sua conta" primeiro.
- **O que o desenho tem e a entrega não tem:** a seção "O que está esperando você" (contagens de
  mensagens, voluntários e doações) e o destino "Mensagens" da barra inferior. Os três recursos
  (RF29, RF26, RF19–RF22) ainda não existem, e um número inventado é pior que nenhum número. Entram
  junto com cada recurso.
- **Por quê:** a conferência lado a lado com o desenho mostrou que a primeira entrega do painel só
  seguia os tokens e as regras de layout, e não a tela.
- **PR:** branch `feat/admin-shell`

## 2026-10-09 — Cor de erro no design system
- **Artefato:** Protótipos (tokens de cor do design system)
- **Antes:** o design system não tinha cor de erro. Mensagens de erro e campos inválidos usavam marrom, a
  mesma tinta do texto, e só se distinguiam por serem negrito e ter borda mais grossa.
- **Depois:** dois tokens novos — `error` (tijolo, `#A52A1E`) e `error-tint` (`#FBE9E4`) — com `#8A0000`
  sobre branco em alto contraste. Aplicados a campo, aviso do formulário, estado de falha e aviso fixo,
  sempre com ícone e texto.
- **Por quê:** pedido do grupo, que viu as mensagens de erro sem cor própria. O tom foi escolhido
  quente, na família da terra e do ocre, e conferido por contraste (6,5:1 sobre o creme).
- **O que não muda:** a paleta da ONG. O vermelho é só de erro; não substitui ocre, azul nem marrom.
- **PR:** branch `feat/error-color`

## 2026-10-09 — RF15 (Inscrição em evento): com conta também, e o que a troca de stack muda
- **Artefato:** Requisitos (RF15) · Arquitetura
- **Antes:** o critério diz "inscrição sem conta … funciona sem sessão e sem JavaScript", com a vaga
  conferida no banco, a confirmação por e-mail (RF18) e a leitura pela equipe (RF16).
- **Depois:**
  - A inscrição funciona **sem conta e também com conta** (pedido do grupo). Com conta, os dados
    entram preenchidos e a inscrição fica ligada à conta; sem conta, nada muda.
  - "Sem JavaScript" **deixa de valer** (aplicação de página única), como já registrado para RF08 e RF10.
    O que continua valendo, e é testado: a validação inteira roda no servidor.
  - A vaga é conferida **no banco, com a linha do evento travada**, numa transação, e há teste de
    concorrência contra o MySQL real.
  - A agenda e a home passam a mostrar as **vagas restantes** em vez da capacidade.
  - O limite contra abuso é **por e-mail e por evento** (5 pessoas); o limite por IP segue adiado.
- **O que o critério não cobria e foi decidido aqui:** a mesma pessoa não se inscreve duas vezes no mesmo
  evento; "Inscrever outra pessoa" logo depois de inscrever; a lista de inscritos não se apaga junto com o
  evento (o banco recusa).
- **O que não existe ainda:** a leitura dos inscritos pela equipe (RF16) e o e-mail de confirmação
  (RF18). O texto da tela **não promete** e-mail.
- **Confirmar com a ONG:** o formulário de levantamento que ela enviou não diz "sem conta" nem "com conta"
  para a inscrição; só lista voluntários e doadores como tipos de conta e pede para facilitar as inscrições.
- **PR:** branch `feat/event-registration`

## 2026-10-09 — RF16 (Consulta de inscritos) e limite contra abuso por conexão
- **Artefato:** Requisitos (RF15, RF16) · Arquitetura
- **Antes:** a equipe não tinha como ler as inscrições; o limite por IP estava adiado.
- **Depois:**
  - A equipe lê os inscritos de cada evento no painel, com contato, CPF (quando o evento pede),
    responsável de menor e **a autorização de imagem de cada pessoa**, e baixa a lista em planilha (CSV).
    A lista é só leitura: nada se corrige nem se apaga por ela.
  - A planilha usa ponto e vírgula e BOM UTF-8 (abre direto no Excel em português) e neutraliza células que
    seriam lidas como fórmula.
  - Inscrição pública passa a ter **limite por conexão: 30 por hora**, além dos limites já existentes
    (a mesma pessoa não se inscreve duas vezes; cada e-mail inscreve até 5 pessoas por evento).
    **O IP não é gravado**: guarda-se só um HMAC dele, com chave do servidor.
- **O que o critério não cobria e foi decidido aqui:** o limite precisa de `TRUST_PROXY` correto no deploy
  (variável de ambiente nova, documentada no README do back-end); a lista não tem paginação nem filtro
  enquanto os eventos forem de dezenas de pessoas.
- **Continua adiado:** limite de tentativas de login (pode reaproveitar a mesma origem hasheada).
- **PR:** branch `feat/registrations-admin`

## 2026-10-09 — RF17 (Lista de presença) e "Minhas inscrições" na área do usuário (RF11)
- **Artefato:** Requisitos (RF11, RF17) · Arquitetura
- **Antes:** a equipe lia quem se inscreveu (RF16), mas não registrava quem veio; a área do usuário só
  mostrava a ficha da conta.
- **Depois:**
  - A equipe marca pelo celular se cada pessoa **veio**, **não veio**, ou deixa **sem conferir**. São três
    estados: quem ninguém conferiu não conta como falta. A lista mostra só o nome e a marca, sem contato.
  - A planilha de inscritos ganha a coluna "Presença".
  - `/minha-conta` passa a listar as inscrições feitas com a conta aberta, separando as próximas das que já
    aconteceram. A pessoa só vê "Presença registrada"; a marca de falta é anotação da equipe e não é mostrada.
- **O que o critério não cobria e foi decidido aqui:** a lista de presença não tem paginação nem mostra
  CPF, e-mail ou telefone; inscrição feita sem conta não aparece em "Minhas inscrições" (não tem dono); a área
  do usuário ainda **não permite editar os próprios dados** nem tem candidaturas e doações, que não existem.
- **Continua adiado:** relatório contando presentes (RF30–RF32), cancelar a própria inscrição, e-mail de
  confirmação (RF18).
- **PR:** branch `feat/attendance-my-registrations`

## 2026-10-09 — Painel no desktop (desenho 7j) e lista de presença conforme o desenho 3g
- **Artefato:** Protótipos (2c, 3g, 7j) · Arquitetura
- **Antes:** o painel era o mesmo cabeçalho escuro no celular e no desktop; a lista de presença tinha dois
  botões por pessoa em cartões ("Veio" / "Não veio") e o nome inteiro.
- **Depois:**
  - No desktop o painel ganha cabeçalho creme com logotipo e selo "PAINEL" e um menu lateral; o celular
    segue com a barra inferior. O menu lateral só tem as telas que existem.
  - A lista de presença segue o desenho: progresso e busca fixos, "Sem conferir" em cima e "Conferidos" embaixo,
    aviso com "Desfazer", "Faltou" no lugar de "Não veio", nome abreviado e telefone do responsável mascarado
    para menor. A planilha usa "Faltou".
- **O que o desenho não cobria e foi decidido aqui:** o cabeçalho escuro da lista some só no celular; no
  desktop a lista fica numa coluna estreita; itens do menu lateral sem tela (Atividades, Pessoas, Conteúdo,
  Biblioteca, Relatório, Configurações) não aparecem até a tela existir.
- **Combinado de processo:** tela sem desenho não se inventa; para-se e avisa-se quem desenha (CLAUDE.md).
- **PR:** branch `feat/panel-desktop-attendance`

## 2026-10-09 — Cancelar inscrição (desenhos 7c e 7d)
- **Artefato:** Requisitos (RF15) · Arquitetura
- **Antes:** quem se inscrevia não tinha como desistir; a vaga só voltava com a equipe mexendo no banco.
- **Depois:** cada inscrição tem um link pessoal que abre uma tela de confirmação e cancela, **sem exigir conta**
  (a inscrição funciona sem conta, então desistir também). A vaga volta para a agenda na hora e a pessoa pode se
  inscrever de novo. A inscrição cancelada fica como registro no banco e deixa de contar nas vagas, nas listas
  da equipe, na presença, na planilha e em "Minhas inscrições". Não cancela depois da atividade.
- **O que o desenho não cobria e foi decidido aqui:** de onde sai o link enquanto não há e-mail (RF18): da tela
  "Inscrição registrada" e de "Minhas inscrições", dois pontos de entrada que não estão nos desenhos; o limite
  por conexão continua contando as inscrições canceladas (foram envios).
- **PR:** branch `feat/cancel-registration`

## 2026-10-09 — Minha conta e Alterar meus dados (desenhos 7a e 7b)
- **Artefato:** Requisitos (RF11) · Protótipos
- **Antes:** `/minha-conta` só mostrava a ficha; não havia como corrigir nome, telefone ou tipo de conta.
- **Depois:** a ficha segue o desenho (nome, telefone, tipo, e-mail) e há uma tela própria para alterar nome,
  telefone e tipo de conta. O e-mail não muda por aqui (exigiria confirmação por e-mail, que não existe) e a tela
  diz isso e aponta o WhatsApp. Papéis e senha não são aceitos por esta rota.
- **O que o desenho não cobria e foi decidido aqui:** "Candidaturas ao voluntariado", "Minhas doações" e "Trocar
  minha senha" não aparecem, porque a funcionalidade por trás de cada um não existe; "Minhas inscrições" fica na
  lista de participações (não está no desenho); "Empresa" é o rótulo só destas duas telas.
- **PR:** branch `feat/account-edit`

## 2026-10-09 — Relatório do painel (desenhos 7i e 7j)
- **Artefato:** Requisitos (RF30, RF31, RF32) · Protótipos
- **Antes:** a equipe não tinha números para a prestação de contas; a presença já era marcada (RF17) mas ninguém a
  somava.
- **Depois:** `/admin/relatorio` mostra, por mês, trimestre ou semestre: atividades realizadas, pessoas inscritas,
  presentes conferidos, crianças e adolescentes presentes, e uma linha por atividade com inscritos, quem veio,
  quem faltou e quem ninguém conferiu. Baixa em planilha (CSV) e imprime como PDF. Inscrição cancelada não conta.
  "Sem conferir" nunca vira falta, e contagem que falhou aparece como traço, não como zero.
- **O que o desenho pedia e não entra:** "novos voluntários", "novos doadores" e "valor recebido". Os módulos de
  voluntariado e de doações (RF19–RF26) não existem neste repositório, então não há dado para esses números.
  Entram quando existirem.
- **O que o desenho não cobria e foi decidido aqui:** a janela do trimestre e do semestre termina no mês atual
  (como no desenho: "Jul–Set", "Abr–Set"), em vez de seguir o ano civil; a tabela traz as cinco atividades mais
  recentes e a planilha, todas.
- **PR:** branch `feat/report`

## 2026-10-10 — Fidelidade ao desenho: Entrar, Agenda no desktop e Menu "Mais" (telas 3f, 6b, 8a e 8b)
- **Artefato:** Protótipos · Requisitos (RF01, RF08, RF10, RF14)
- **Antes:** o celular de `/entrar` não seguia a 3f (nota de destino antes das abas, "Voltar" com nome, asteriscos nos
  rótulos, texto de apoio diferente); o desktop não tinha a 8b nem o menu da 8a (o "Mais" abria a folha do celular);
  a agenda no desktop perdia a coluna lateral com os tipos e o cartão de escolas quando havia um tipo só.
- **Depois:** as três telas seguem o desenho (medido contra o HTML do Claude Design, texto por texto, e conferido no
  Chromium a 390, 320 com A+ e alto contraste e 1440). Ajustes compartilhados que o desenho pedia e estavam fora:
  contêiner de 1200px, escala tipográfica, cabeçalho, rodapé, selo de data, campo de 52px, botão de aplique de 4px
  e rótulo de campo sem asterisco (opcional diz "(opcional)").
- **Deixado de fora de propósito (não existe, ou não há texto):** "Biblioteca" no cabeçalho, "Depoimentos", "Para
  empresas" e "Perguntas frequentes" no menu, foto e "Ver detalhes" no destaque da agenda, "Esqueci minha senha" (depende
  de e-mail) e a lista numerada de benefícios do 8b (fala de candidatura e doações). "Acervo" no painel fica sem linha
  de explicação.
- **Decidido aqui, sem desenho:** no painel do desktop, quem entrou ganha "Minha conta" e "Painel da equipe" (a equipe
  perderia o único caminho para `/admin` no desktop); "seg a sáb, 9h–18h" no cartão de contato veio do desenho e
  precisa ser confirmado com a ONG.
- **PR:** branch `fix/design-fidelity`

## 2026-10-10 — Entrar no desktop igual ao desenho e menu "Mais" abrindo ao passar o mouse
- **Artefato:** Protótipos
- **Antes:** o lado esquerdo de `/entrar` no desktop omitia a lista numerada do desenho 8b e trocava o texto de apoio por
  um que o grupo não aprovou; o menu "Mais" só abria no clique.
- **Depois:** o lado esquerdo traz o texto e a lista numerada do desenho (também no texto de apoio do celular), e o menu
  abre quando o ponteiro chega em "Mais", fechando ao levar o ponteiro para a página escurecida ou para longe do botão
  (clique, Esc e clique fora continuam valendo).
- **Observação:** o texto promete acompanhar candidatura e doações, funcionalidades que o site ainda não tem — decisão do
  grupo, revisar quando RF19–RF26 entrarem.
- **PR:** branch `fix/login-left-menu-hover`

## 2026-10-10 — Hover padrão, saída animada do menu e ajustes de acabamento
- **Artefato:** Protótipos
- **Antes:** botões e links sem resposta ao hover (cada tela decidia o seu), o menu "Mais" do desktop sumia de uma vez, a seta do
  "Mais" ficava abaixo do texto, o menu reabria sozinho depois do Esc se o mouse ficasse parado sobre "Mais", a barra de rolagem
  da página sumia (e empurrava o layout) quando o menu abria, e um 404 da própria API (rota inexistente num servidor
  desatualizado) aparecia como "Página não encontrada" na lista de presença.
- **Depois:** hover padrão para o projeto (ver "Hover é padrão" no CLAUDE.md), menu com saída animada, seta alinhada, sem
  reabertura fantasma e sem travar a rolagem, e "Página não encontrada" só quando a API diz que o **evento** não existe
  (`event_not_found`); qualquer outro erro mostra "Não conseguimos carregar a lista", com "Tentar de novo".
- **PR:** branch `fix/admin-hover-and-polish`

## 2026-10-10 — Painel no padrão das rodadas 9 e 10 (desenhos 9a–9c e 10a–10e)
- **Artefato:** Protótipos · Requisitos (RF13, RF16, RF17, RF30–RF33)
- **Antes:** o painel seguia o desenho 2c/7j: cabeçalho escuro no celular, "Mais" abrindo o menu público, home com "Ações rápidas"
  e "Todas as telas", formulário de evento num bloco só com data e hora no mesmo campo.
- **Depois:** cabeçalho creme nos dois tamanhos, menu lateral com grupos, "Mais" como folha própria do painel, home com
  saudação, próximo evento, "Depois" e "Precisa de você", e o formulário em seções numeradas (desktop) e passos (celular), com
  Dia, Início e Fim separados. Lista de presença, inscritos, eventos e relatório ganharam a mesma moldura. O texto de
  `/minha-conta` e `/minha-conta/dados` e o relatório mobile ganharam os tamanhos do desenho (título de 30px, legendas de 12px).
- **Deixado de fora de propósito (não existe):** busca global, Atividades, Contatos, Voluntários, Doações, Depoimentos,
  Publicações, Galeria, Biblioteca, Avisos, Exportar, Configurações, a fila com detalhe, "+ Subir fotos", autosave do rascunho e
  "Publicar na agenda" (salvar continua não publicando). "Precisa de você" conta só rascunhos.
- **Decidido aqui, sem desenho:** "Minha conta" e os controles de leitura moram na folha "Mais"; o item do menu lateral tem 44px.
- **PR:** branch `feat/admin-design-pattern`

