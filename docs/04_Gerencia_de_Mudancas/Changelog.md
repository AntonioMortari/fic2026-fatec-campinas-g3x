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

## 2026-10-11 — Conferência com o zip do Claude Design: seis ajustes de fidelidade
- **Artefato:** Protótipos (telas 2a/6a, 7a, 7c, 7d, 7j e "Movimento")
- **Antes:** a tela "Inscrição cancelada" (7d) aparecia no layout focado, sem logotipo nem barra inferior; o voltar de 7c dizia só "Agenda"; "Sair da conta" (7a) saía como botão com borda e o título tinha 30px; o botão "Baixar CSV" do relatório quebrava em duas linhas de 1024 a 1440px; o cartão "Próxima atividade" da home trazia a linha de vagas, o horário de término e um sobretítulo também no celular (171px de altura); o toque nos botões e links fechava em 150ms.
- **Depois:** 7d é a rota `/inscricao/cancelada` (cabeçalho com logotipo e barra inferior, como no desenho; recarregar volta para a confirmação, que diz "já foi cancelada") e 7c diz "Voltar para a agenda"; 7a tem "Sair da conta" como link e título de 32px; os dois botões do relatório não quebram o rótulo; o cartão da home mostra só o horário de início e o local, a categoria como prefixo no celular ("Contação: Cafú e o Café") e como sobretítulo no desktop, sem a linha de vagas (a agenda continua mostrando); o toque fecha em 90ms (a transição de hover continua em 150ms). Os títulos de 7c e 7d passaram a 30px, como no desenho.
- **O que continua diferente, e não foi tocado:** a cor de erro (`#A52A1E` aqui, `#A3341F` nas telas 7), o corpo do botão (16px aqui, 15px no desenho), o sobretítulo de 13px no desktop, o peso 600 do "Por atividade", a linha "Leitura" dentro do menu em folha e a barra inferior (o desenho tem 5 itens nas rodadas 2 e 3 e 4 itens, com "Biblioteca", nas 7). Também o formulário de evento no celular (3 passos aqui, 4 no desenho) e a lista de presença com cabeçalho creme (o 3g era escuro). Dependem de decisão de quem desenha.
- **Por quê:** conferência número a número de todas as telas implementadas contra o zip, em 390 e 1440px; cada ajuste é uma diferença que não tinha justificativa de desenvolvimento.
- **PR:** branch `fix/design-alignment`

## 2026-10-11 — Voluntariado: página, candidatura e fila da equipe (RF24, RF25, RF26)
- **Artefato:** Arquitetura · Protótipos (telas 10c, 10d, 10e, 10f, 10g, 10i, 10j, 10k e o item da 7a)
- **Antes:** `/voluntariado` e a candidatura não existiam (o link "Voluntariado" do menu levava ao 404), a lista "Minhas participações" só tinha inscrições, e o painel não tinha "Pessoas". O projeto de origem guardava a candidatura em duas tabelas sem transação e protegia a regra de duplicata só no código.
- **Depois:** três tabelas novas por migration (`volunteer_areas` com as 5 áreas reais, `volunteer_applications`, `volunteer_application_areas`), rotas documentadas no Swagger, e as telas conforme o desenho: `/voluntariado`, `/voluntariado/candidatura` (sem conta, formulário e "você já se candidatou"), `/minha-conta/candidaturas`, o item "Candidaturas ao voluntariado" em `/minha-conta`, e `/admin/voluntarios` (lista e detalhe) com selo de novas no menu do painel. **Decisões de arquitetura:** candidatura e áreas gravadas numa transação só; quem tem candidatura viva não manda outra e a regra vale **no banco** (coluna gerada `active_key` com índice único, como em `registrations`), não só no service; dois vocabulários de situação (equipe: Nova / Em contato / Voluntariando / Encerrada; pessoa: "Recebida, ainda sem resposta" etc.); o `PATCH` da equipe grava só a situação.
- **Diferenças em relação ao desenho, e por quê:** (1) sem o cartão "Ver o mural de avisos" da 10g: o mural (RF27) não existe e um link para o 404 é pior que a ausência; (2) a nota interna da 10j fica de fora, como o próprio desenho diz; (3) o limite do texto da candidatura é 2000 caracteres (o desenho avisa que o 1000 é exemplo; é o limite do projeto de origem); (4) a linha do tempo da 10f avança com a situação, o desenho só mostra a primeira etapa marcada; (5) telefone e e-mail das telas 10d e 10f são links, para tocar e abrir o WhatsApp ou o e-mail; (6) no celular os valores de contato do painel têm alvo de 44px (regra do projeto), então a linha fica 12px mais alta que no desenho; (7) o chip de área da fila é um `<select>` nativo; (8) a entrada "Voluntários" fica em "Pessoas" no menu lateral e na folha "Mais", sem o botão "Pessoas" da barra inferior (a barra do painel continua com Início, Agenda e Mais).
- **Contato:** "Tenho uma dúvida" (10c) e "Fale com a gente" (10i) apontam para `/contato`, que já existe (PR do RF06/RF07).
- **Por quê:** requisitos RF24 a RF26 e o desenho das rodadas 4 (Contato e Voluntariado) do Claude Design; o desenho exige que candidatar-se seja ligado a uma conta e que "encerrar" devolva o direito de se candidatar de novo, o que só se garante contra dois envios simultâneos com uma restrição no banco.
- **PR:** branch `feat/volunteering`
## 2026-10-11 — RF06 e RF07 (Contato): formulário público, limite por conexão e duas diferenças do desenho
- **Artefato:** Requisitos · Protótipos
- **Antes:** o menu ("Mais" no desktop, folha do celular) apontava para `/contato`, que dava 404. O RF07 (formulário de
  contato) dizia apenas que qualquer pessoa pode escrever para a ONG; não havia tabela, rota nem tela.
- **Depois:** `/contato` implementa as telas 10a, 10b e 10h do Claude Design — canais diretos antes do formulário,
  formulário com aviso único no topo e regra embaixo do campo, e a caixa "Mensagem recebida" no topo depois do envio.
  Back-end: tabela `contacts` (migration 20261011130000), `POST /api/contacts` aberto, **sem conta**, que não devolve a
  linha nem dado pessoal; o consentimento é obrigatório e gravado como data (`consented_at`); 30 mensagens por hora por
  conexão (HMAC do IP, o IP nunca é gravado, `429 too_many_requests`). Não existe rota de leitura: a fila de atendimento
  para a equipe é o RF29. Diferenças em relação ao desenho: (1) a frase "…está na política de privacidade" **não tem
  link**, porque a página `/privacidade` ainda não existe e um link para o 404 é pior que a ausência; vira link quando a
  página for migrada; (2) o espaço "Mapa" virou o embed do Google Maps sem chave (como no projeto de origem), na mesma
  moldura e proporção, carregado só quando a pessoa rola até ele — isso passa a mandar uma requisição ao Google para
  quem chega até lá, e **a página de privacidade precisa dizer isso**; (3) a palavra "opcional" fica no rótulo do telefone
  e da instituição nos dois tamanhos, e o campo tem 52px (regra do alvo de toque) em vez dos 50px do desktop. Também: o
  nome da coluna é `consented_at`, como em `users` e `registrations`, e não `consent_at`.
- **Por quê:** um formulário público grava dado pessoal de quem não tem conta, então a validação no servidor é a única
  barreira e o limite por conexão é obrigatório; o desenho não pode prometer prazo de resposta nem apontar para página
  inexistente (regras da ONG: não inventar conteúdo).
- **PR:** branch `feat/contact`

## 2026-10-12 — Mensagens de contato: fila de atendimento da equipe (RF29, desenhos 10l, 10m e 10n)
- **Artefato:** Requisitos · Arquitetura · Protótipos
- **Antes:** `POST /api/contacts` gravava a mensagem em `contacts` e nada a lia: a equipe só a via no banco. A tabela
  não tinha situação de atendimento nem nota. O RF29 (registro central de contatos) não tinha tela.
- **Depois:** `/admin/contatos` e `/admin/contatos/:id` conforme os desenhos 10l (desktop), 10m (lista no celular) e
  10n (detalhe no celular). Back-end: migration `20261012100000-add-contact-triage` (`status` ENUM `new`, `in_contact`,
  `done` com padrão `new`; `staff_note` TEXT; índice `(status, created_at)`) e as rotas só da equipe
  `GET /api/admin/contacts` (filtro `status`, `page`, `pageSize` com padrão 20, `counts`, `pagination`), `/counts`,
  `/export.csv`, `/:id` e `PATCH /:id` (`{ status?, staffNote? }`), todas no Swagger. A ordem da fila (nova, em contato,
  concluída, e a mais recente primeiro) é feita no SQL, para a paginação cortar a lista já ordenada. O formulário público
  continua sem aceitar situação nem nota (teste com corpo hostil), e o `PATCH` grava só essas duas colunas. **Não há
  `DELETE`**: a mensagem é registro; a exclusão a pedido (LGPD) segue como decisão à parte e hoje se faz por SQL. Menu:
  "Mensagens" em "Pessoas", com selo de novas.
- **Diferenças em relação ao desenho, e por quê:** (1) **sem origem** ("PARA ESCOLAS", "Biblioteca") e sem filtro por
  origem: `contacts` não tem essa coluna, o próprio desenho pede para confirmar, e inventar a origem a partir do texto
  seria dado fabricado; o sobretítulo diz "CONTATO". (2) **"Contatos" no menu e "Mensagens" no título**, que o desenho
  mostra, foram unificados em **"Mensagens"**, como as notas do 10l sugerem. (3) **Paginação** de 20 por página com
  "Página N de M", que o desenho mostra e o Documento de Requisitos não descreve: uma fila que só cresce não cabe numa
  rolagem, e cortar sem dizer esconderia mensagem. (4) **Nota interna** exige migration (o desenho avisa); entra aqui
  porque a coluna é aditiva e não toca em nada do que a pessoa escreveu. (5) O selo do topo do detalhe no celular diz
  "Painel", como o resto do painel, e não "Equipe". (6) Sem a busca global do cabeçalho (não existe no projeto).
- **Por quê:** o formulário de contato (RF07) estava ligado a uma tabela que ninguém podia ler. Sem esta tela, uma
  escola que escreve não é respondida, e a ONG lê WhatsApp e telefone todos os dias, não o painel do banco.
- **PR:** branch `feat/admin-contacts`

## 2026-10-12 — Para escolas (RF38, desenhos 11h e 11i)
- **Artefato:** Protótipos · Requisitos (RF38)
- **Antes:** `/para-escolas` levava ao 404 (menu "Mais", folha do celular, banner da home e cartão da agenda).
- **Depois:** página estática `/para-escolas` conforme os desenhos 11h (celular, com barra fixa de WhatsApp e e-mail acima da barra inferior) e 11i (desktop, hero em duas colunas e cartão lateral com a ficha e o pedido). Textos do desenho; dados em `lib/schools.ts`; contatos de `lib/contacts.ts`; foto `sector-literary.jpg`, já pública. A seção "Onde já estivemos" some inteira se a lista estiver vazia.
- **Diferenças em relação ao desenho e por quê:**
  - o desenho põe aplique no botão do WhatsApp **e** sombra ocre na foto, o que excede "no máximo um aplique por tela" do guia; foi mantido como no desenho, a confirmar com quem desenha;
  - a nota do desenho diz que o formulário traria a origem "Para escolas" para a fila (10l), mas não existe coluna de origem em `contacts` e a tela da equipe escreve sempre "CONTATO"; nada foi criado, a decidir pelo grupo;
  - "Ver o catálogo completo" leva a `/projetos`, que ainda não existe (404, como os demais links do menu);
  - no celular o cartão "Solicitar uma atividade" não repete os botões (estão na barra fixa), e no desktop a ficha e o pedido formam um cartão só; para isso a ordem do código difere da ordem visual no celular.
- **Por quê:** RF38 é o caminho de quem chega querendo pedir uma atividade; o contato é o objetivo da página.
- **PR:** branch `feat/schools-page`

## 2026-10-13 — Detalhe do evento, foto do evento e regra de inscrição (RF14/RF13, desenhos 13a–13d)
- **Artefato:** Protótipos · Arquitetura · Requisitos (RF13, RF14, RF15)
- **Antes:** "Ver detalhes" não existia; evento não tinha foto; um evento saía de "Em breve" quando terminava
  (`COALESCE(ends_at, starts_at) >= agora`) e a inscrição fechava quando terminava; todo evento aceitava inscrição
  pelo site; uma contagem de vagas que falhasse derrubava a lista inteira com 500.
- **Depois:** rota `/agenda/:id` com os seis estados do desenho 13; `registrationStatus` calculado no servidor
  (`open`, `few_left`, `full`, `not_on_site`, `started`, `unknown`); coluna `events.registration_on_site`; foto
  guardada em arquivo no disco do servidor (`UPLOADS_DIR`; o evento guarda `image_file` e quatro colunas de apoio, com `CHECK` de tudo-ou-nada), servida em
  `GET /api/events/:id/image` e enviada em `PUT /api/admin/events/:id/image` (JSON em base64, tipo pela assinatura
  dos bytes, até 4 MB, declaração RN07 gravada como data); `DELETE` da foto; "Ver detalhes" em todo cartão da
  agenda; no painel, foto e "Pelo site | Sem inscrição pelo site" no formulário do evento. Migration
  `20261012120000`.
- **Comportamento que mudou (a confirmar com o grupo):** (1) o evento sai de "Em breve" **no instante em que
  começa** e a inscrição **fecha no início** (o desenho 13c marca como "proposta"; a borda é estrita: no instante
  exato do início já está fechado, o que o desenho escreve como "agora ≥ começa_em"; a mensagem pedia `>=` para
  "upcoming", e `>=` deixaria o evento "Em breve" e fechado ao mesmo tempo); (2) cancelar inscrição continua fechando
  só no fim da atividade; (3) contagem de vagas que falha vira `unknown`, nunca zero nem aberta; (4) corpo grande
  demais passou a responder 413 `payload_too_large` em vez de 500.
- **Diferenças em relação ao desenho e por quê:** sem "Ver as fotos na galeria" (a galeria não existe neste projeto;
  link para o 404 é pior que a ausência); sem foto no destaque da agenda (o desenho 6b/2b não a mostra); "Onde" em
  uma linha (`location` é um campo só); com foto gravada, a descrição aparece como texto e só muda trocando a foto;
  **botão "Remover foto" acrescentado** (não está no desenho; sem ele uma foto de criança subida por engano não sai,
  e a regra 12 não deixa); "Últimas vagas" aparece quando restam 3 ou menos (o desenho não define o limiar); a
  descrição da foto é obrigatória no servidor e no banco, como o desenho diz.
- **Por quê:** o desenho 13 fecha uma divergência encontrada no código antigo (agenda e inscrição fechavam em
  momentos diferentes) e dá ao evento a foto que o RF13 pedia; a foto fica em arquivo no servidor **por decisão do usuário** (a primeira versão a guardava em MEDIUMBLOB no MySQL, para não depender de volume num deploy ainda indefinido). O custo é de deploy: em plataforma com disco efêmero é preciso um volume persistente em `UPLOADS_DIR`, ou as fotos somem a cada deploy; o `docker-compose.yml` já monta o volume `uploads-data`. O nome do arquivo é sempre gerado pelo servidor (uuid + extensão pela assinatura dos bytes), por causa de path traversal.
- **PR:** branch `feat/event-detail`

## 2026-10-12 — Back-end: esquemas de validação saem dos controllers
- **Artefato:** Arquitetura (organização do back-end)
- **Antes:** os esquemas Zod ficavam exportados dentro de cada controller, que passava a ter duas responsabilidades (validar e responder), e as rotas importavam o esquema do controller.
- **Depois:** `backend/src/validators/<módulo>.validator.ts`, um por módulo, mais `fields.validator.ts` com os campos compartilhados (nome, telefone, tipo de pessoa). A rota importa o esquema e o passa ao `validate`; o controller importa só o tipo. O fluxo `routes → middlewares → controllers → services → models` não muda.
- **Comportamento:** nenhum. Mudança de lugar, sem alterar mensagem, regra ou rota; os 504 testes unitários e os 163 de integração (MySQL real) passam como antes.
- **Por quê:** responsabilidade única do controller e dependência no sentido certo (a rota não precisa do controller para obter a validação).
- **PR:** branch `refactor/backend-validators`

## 2026-10-10 — Página "Quem somos" (RF02, desenho 5b)
- **Artefato:** Protótipos · Requisitos (RF02)
- **Antes:** o link "Quem somos" do menu, do cabeçalho e da home levava ao 404.
- **Depois:** `/quem-somos` fiel ao desenho 5b: hero com a frase-missão, índice de chips fixo que marca a seção
  visível, Sankofa, idealizadores com linha do tempo, os três setores, "Para quem", "Onde estamos" com mapa e "Como
  chegar", e a chamada final para projetos, voluntariado e apoio. Conferido no Chromium a 390, 320 e 1440.
- **Por quê:** paridade com a V1. Por decisão do Yuri, a página segue o desenho também no texto e nos espaços de imagem.
- **Diferenças registradas:** o texto é o resumido do 5b, não o literal da V1 — o RF02 pede o texto da organização
  "palavra por palavra", então a ONG precisa aprovar o resumo; os quadros "Símbolo Sankofa (arte da ONG)" e "Foto de
  Wil e Nathy" ficam visíveis até a ONG enviar o material; o sobretítulo "Quem somos" e a faixa listrada no meio da
  página contrariam duas regras de layout do `CLAUDE.md` ("sobretítulo = seção do menu", "tela não desenha faixa").
- **Decidido aqui, sem desenho:** no desktop, coluna de leitura de ~720px (só o hero e os setores usam a largura
  toda); os cards de setor não são links; o mapa é o iframe do Google sem chave (a Maps Embed API fica para depois).
- **Confirmar com a ONG:** texto resumido, arte do Sankofa e foto do casal.
- **PR:** branch `feat/about-page`

## 2026-10-13 — Deploy: Dockerfiles de produção
- **Artefato:** Arquitetura (deploy)
- **Antes:** o deploy era "a definir"; o `backend/Dockerfile` tinha o estágio `production` sem migrations, health check nem pasta de fotos, e o front só tinha o estágio de desenvolvimento.
- **Depois:** `backend/Dockerfile` roda `npm run db:migrate:prod` (migrations compiladas) antes de `node dist/server.js`, com `HEALTHCHECK` em `/api/health` e `/uploads` para as fotos; `frontend/Dockerfile` ganhou os estágios `build` (com `VITE_API_URL` como argumento de build) e `production` (nginx com fallback de SPA, cache de `/assets` e cabeçalhos).
- **Comportamento da aplicação:** nenhum; só empacotamento. O `docker-compose.yml` de desenvolvimento não mudou.
- **Não verificado:** o `docker build` completo (o `npm ci` dentro do contêiner não alcança o registro do npm neste ambiente) e o Coolify em si.
- **Por quê:** RNF-DEP-01/02 (aplicação em nuvem, com acesso público) e RNF-REP-02 (o deploy avaliado é o da `main`).
- **PR:** branch `chore/deploy`

## 2026-10-14 — Movimento sutil: do desenho para tokens e padrões reutilizáveis
- **Artefato:** Protótipos
- **Antes:** a seção "Movimento" do desenho (toque 90ms, entrada 200ms, folha 280ms, página 150ms,
  "reduzido mantém a mudança de estado, sem animação") estava implementada em cada tela, com
  milissegundos escritos à mão; carregamento era uma linha de texto, a folha do menu não tinha saída,
  o aviso sumia de uma vez e a rolagem (erro de formulário, "voltar", passos) era sempre instantânea.
- **Depois:** durações e curva viraram tokens (`--motion-*` em `frontend/src/styles.css`); entram o
  esqueleto de carregamento (só depois de 120ms, com a altura reservada), a entrada escalonada de
  listas, a rolagem suave e restaurada, a saída da folha e do aviso, a altura do `<details>` e o
  botão "Enviando…" com largura fixa. `prefers-reduced-motion` desliga tudo num bloco só. Os números
  do desenho não mudaram; a saída da folha (200ms) é nova e mais curta que a entrada (280ms).
- **Por quê:** a agenda deslocava o conteúdo em 0,108 de CLS ao carregar, a tela não dizia o que
  acontecia entre o toque e a resposta, e quem voltava para a agenda pelo botão do navegador reaparecia no topo da lista.
  Ajuste de implementação: não altera a proposta aprovada nem nenhum critério de aceitação.
- **PR:** branch `feat/subtle-motion`

## 2026-10-16 — Home ampliada (desenhos 14a e 14b)
- **Artefato:** Protótipos (Início, rodada 14) · Requisitos (RF01, RF04, RF05) · Arquitetura (o payload público da galeria)
- **Antes:** a home tinha o herói, a próxima atividade ao lado de "Por onde começar" em lista, "O que fazemos" e a faixa de escolas. Notícias e galeria existiam só em páginas próprias.
- **Depois:** a home segue o desenho "Início ampliado", seção por seção: próxima atividade como cartão de largura total, "Por onde começar" em 4 cartões coloridos, e seções novas com conteúdo que o site já tem: **Nossa história** (Sankofa e quem idealizou), **Da galeria** (as 5 fotos mais recentes), **Notícias e campanhas** (as 3 últimas), **Na mídia**, **Onde já estivemos** e **Onde estamos** (mapa, endereço, "Como chegar" e WhatsApp). As que dependem de algo publicado somem sozinhas quando não há nada. A altura de cada seção bate com a do desenho (medida no navegador).
- **Back-end:** `GET /api/gallery` passou a trazer `publishedAt` em cada foto (quando foi ao ar), para a home ordenar as mais recentes entre os álbuns. Teste novo e Swagger atualizado.
- **Na mídia:** a matéria da Folha de S.Paulo em destaque e a participação na Rede Globo (2021) ao lado, com o que o material da ONG mostra e os três links que o grupo passou (a matéria no blog Pitaco Cultural da Folha, de 30/03/2021, o vídeo no Globoplay e a matéria do Gshow sobre o participante do The Wall, de 2021), abrindo em outra aba. Não pude abrir os três endereços no ambiente de desenvolvimento (domínios bloqueados): conferir. Item sem `url` em `lib/press.ts` não mostra link, e um endereço adivinhado é pior que nenhum. Fora do desenho: The Wall é um quadro do Caldeirão do Huck, então é **uma** participação (o desenho lista dois programas) e o item não tem imagem.
- **Ficou de fora, e por quê:** "Quem já participou" (depoimentos) não tem como existir sem um jeito de enviar e aprovar o texto, que não faz parte do que foi construído.
- **Diferenças em relação ao desenho, e por quê:** a linha de privacidade do mapa aparece também no celular (o mapa é do Google); "Apoiar" mantém o texto corrigido ("Recursos para manter as atividades, a equipe e os materiais"); "Onde já estivemos" usa os 11 locais conferidos com o material da ONG; os apliques do desenho (herói, botão de inscrição, foto da história) valeram sobre a regra de "um por tela", que o desenho contraria.
- **Por quê:** pedido do grupo, agora que notícias e galeria existem.
- **PR:** branch `feat/home-expanded`

## 2026-10-16 — Quem somos alinhada ao desenho 15a e 15b
- **Artefato:** Protótipos (Quem somos, rodada 15)
- **Antes:** a página seguia a proposta 5b: o desktop era a versão do celular numa coluna estreita (foto à esquerda, cartão à direita, Sankofa e idealizadores em coluna de 45rem, chamada final em faixa marrom), o índice tinha 4 itens e vários textos eram só os do celular.
- **Depois:** a página segue o desenho 15a (desktop) e 15b (celular), seção por seção e com a altura de cada bloco igual à do desenho: frase grande à esquerda com o índice (agora 5 itens, com "Para quem") dentro do bloco de abertura e a foto à direita com sombra ocre; Sankofa em faixa de largura total; "Quem idealizou" com o texto novo, 7 etiquetas e linha do tempo em duas colunas; setores com a cor de cada um no topo do cartão; "Onde estamos" em duas colunas, com o texto longo no desktop e o aviso do mapa; chamada final num cartão com sombra. Os textos têm duas versões, a completa (desktop) e a resumida (celular), como no desenho.
- **Diferenças em relação ao desenho, e por quê:** o mapa é o do Google (o desenho põe um quadro listrado), "Como isso afeta sua privacidade" não é link porque `/privacidade` ainda não existe, e os dois placeholders (arte do Sankofa e foto do casal) continuam, porque o material da ONG não traz nenhum dos dois.
- **Desfeito:** a seção "Missão e valores", o chip "Missão", o CNPJ no rodapé e o "segundo a Folha" no marco de janeiro de 2020, que tinham sido acrescentados no mesmo dia e **não existem no desenho**.
- **Por quê:** pedido do grupo de deixar a página igual ao Claude Design.
- **PR:** branch `feat/content-seed`

## 2026-10-16 — Textos do site conferidos com o material da ONG
- **Artefato:** Protótipos (telas 2a, 3f, 5b, 8a e 11h) · Requisitos (conteúdo)
- **Antes:** alguns textos vinham dos desenhos e não constavam do material que a ONG enviou: "SESC Santo Amaro" e "Casa de Cultura São Rafael" nos locais de "Para escolas", "seg a sáb, 9h–18h" no menu, "Livros, instrumentos, materiais" em "Apoiar", "50 minutos na maioria" sem as exceções, e uma tela de entrar que prometia acompanhar doações e receber avisos da equipe, que não existem. A missão, os valores e o CNPJ, que a ONG escreveu no formulário, não apareciam.
- **Depois:** (1) locais trocados por "Paço Cultural Santo Amaro" e "Casa de Cultura Santo Amaro" (currículo de Wil Oliveira) e "II Festa Preta" sem o parque, que os cartazes não nomeiam; (2) duração com as exceções (Eu Griot, 1h30; Batuque na Cozinha e Brincadeiras Encantadas na Mata, a combinar); (3) o horário saiu do menu ("WhatsApp e ligação"); (4) "Apoiar" diz "Recursos para manter as atividades, a equipe e os materiais", que é o que a ONG lista como dificuldade; (5) a tela de entrar só promete candidatura, inscrições e alterar os dados; (6) a missão, os valores e o CNPJ que a ONG escreveu no formulário **não entraram no site**: o desenho de Quem somos (15a e 15b) diz "sem acréscimos" e o rodapé do desenho não tem CNPJ (uma tentativa de acrescentá-los foi desfeita no mesmo dia); ficam como proposta para quem desenha.
- **Não alterado, por não ter fonte melhor:** a classificação "Livre" vale para as contações (Cafú e o Café, Catirina e Nego Dito, A Cabaça e o Canto Ancestral, Eu Griot); o material não diz a de Banzo, Brasil Negreiro nem Memória Negra. A grafia do nome da idealizadora varia no material ("Nathy", "Nati", "Nathália"; um PDF traz "Nathi Nunes"): o site usa "Nathália (Nathy) Monteiro", como a Folha.
- **Por quê:** a regra 8 (nunca inventar conteúdo) e a conferência pedida pelo grupo contra a pasta de informações da ONG.
- **PR:** branch `feat/content-seed`

## 2026-10-16 — Seed de conteúdo: notícias e galeria na primeira subida
- **Artefato:** Arquitetura (seed e imagens) · Requisitos (RF04, RF05, RN07)
- **Antes:** o site subia vazio: "Ainda não publicamos nenhum álbum" na galeria e nenhuma notícia, até a equipe publicar à mão.
- **Depois:** `npm run db:seed:content` (e o `docker compose up`, depois da seed de contas) publica **4 notícias e 34 fotos**, todas tiradas do material que a ONG enviou (portfólio, currículo, fichas técnicas, cartazes e o formulário da FATEC); nada foi inventado. As fotos vêm das imagens soltas e de **recortes dos PDFs da ONG** (os PDFs guardam as imagens como slides, então foram recortadas e otimizadas). Notícias: Cafú e o Café no CCSP (2/11/2024), contação na IX FELIZS (22/9/2023), Leilão Solidário (campanha, 20/11/2021) e o quadro The Wall (19/3/2021), cada uma com a data que o cartaz ou o jornal dá. Galeria, em 8 álbuns: "Ateliê Afro Cultural" (7), "Brasil Negreiro: Imaginário em Liberdade" (7), "Banzo" (4), "A Cabaça e o Canto Ancestral" (5), "Catirina e Nego Dito" (5), "Brincadeiras Encantadas na Mata" (3), "Eu Griot" (1) e "Cafú e o Café" (2).
- **Regras de segurança da seed:** só roda se **não há nenhuma notícia nem foto** (um reinício nunca traz de volta o que a equipe apagou); `--force` acrescenta só o que falta (por título e por álbum + descrição); lê todos os arquivos antes de gravar o primeiro; apaga o arquivo se a linha é recusada. Em produção ela é opcional: `SEED_CONTENT=true` no contêiner (o `Dockerfile` copia `seed-content/` para junto do `dist/`).
- **Decisões que precisam de confirmação da ONG:** (1) **a declaração de autorização de uso de imagem (RN07) é gravada pela própria seed**, com a data da execução, porque a galeria só publica foto autorizada. As fotos mostram só Wil Oliveira (adulto, idealizador) e objetos (cenários, bonecos, cabaças, livros) e foram entregues pela ONG para o site, mas a **autorização por escrito dele (e do fotógrafo, quando houver) precisa ser guardada**; se não for dada, apague as fotos em `/admin/galeria`. (2) **Ficaram de fora de propósito:** fotos com crianças ou plateia (regra 12), mesmo as boas (fantoches, oficinas, Dia das Crianças, Ambev); imagens de TV (Globo, com marca d'água); o recorte da Folha; e as imagens da ficha "Batuque na Cozinha", que são feitas por IA e não registram nada. Não há crédito de fotógrafo em quase nenhuma imagem (só "@pedro_qzs" aparece nas que ficaram de fora): **perguntar à ONG quem fotografou**. (3) Os cartazes e a imagem do jornal não viraram imagem: têm marcas de terceiros (Globo, Folha, patrocinadores). Alguns recortes têm resolução baixa (450 a 640 px, saíram de slides pequenos); a ONG pode mandar os originais. (4) Notícias de eventos passados dizem "estava na programação" quando só há o cartaz, porque o material não prova que aconteceu como anunciado.
- **Por quê:** pedido do grupo de popular o site na primeira subida com conteúdo real.
- **PR:** branch `feat/content-seed`

## 2026-10-14 — Galeria (RF05, desenhos 11a, 11c, 11d e 11j–11m)
- **Artefato:** Protótipos · Requisitos (RF05, RN07) · Arquitetura (nova tabela, rotas e armazenamento de imagens)
- **Antes:** o link "Galeria" do menu levava ao 404 e não havia como a equipe subir, publicar ou apagar fotos.
- **Depois:** `/galeria` (álbuns por nome, miniaturas quadradas, tela cheia com anterior/próxima que dão a volta, setas, Esc e deslizar) e, no painel, `/admin/galeria` (lista com filtros, subir foto, pôr no ar/tirar do ar com confirmação) e `/admin/galeria/:id/apagar` (tela de confirmação). Back-end: tabela `gallery_photos`, `GET /api/gallery`, `GET /api/gallery/:id/image` e `/api/admin/gallery/*`. As fotos ficam no disco do servidor (`UPLOADS_DIR`), com nome gerado e tipo lido dos bytes, até 4 MB; foto maior é reduzida no celular antes do envio.
- **RN07 em três camadas:** subir nunca publica; a declaração de autorização vira data e, sem ela, a API recusa publicar (409) **e o banco também** (`CHECK published = 0 OR authorized_at IS NOT NULL`); a rota pública da imagem responde 404 para foto guardada, tirada do ar ou sem autorização, então o arquivo também não sai. Apagar remove a linha e o arquivo.
- **Diferenças em relação ao desenho, e por quê:**
  - o desenho foi pensado sobre o bucket do Supabase (migration 008); aqui o arquivo é servido pela API, então **o aviso de "depósito aberto" não existe** e "Tirar do ar" diz "alguns minutos" (cache de 5 minutos) em vez de "até uma hora" (prazo da URL assinada);
  - **sem "Conhecer o projeto →"** nos álbuns nem no visualizador: o site ainda não tem projetos (RF03), e um link para o 404 é pior que a ausência;
  - **a declaração de autorização é opcional ao subir**, como o desenho decide de propósito ("sem ela a foto sobe e fica guardada"): a foto fica "Sem autorização de imagem" e não pode ir ao ar. O pedido inicial da equipe de desenvolvimento era exigir a declaração; o desenho venceu por ser a fonte de verdade das telas, e a regra de que nada vai ao ar sem autorização continua inteira;
  - **edição só do texto, pedida pelo grupo e sem tela no desenho** (o desenho diz que, para corrigir, sobe-se de novo e apaga-se a antiga): `PUT /api/admin/gallery/:id` e `/admin/galeria/:id/editar` reescrevem **álbum, descrição e legenda** — nada além. O arquivo, a declaração de autorização e a publicação não mudam por aí, seja qual for o corpo (Zod descarta o resto **e** o service lista as três colunas), então a RN07 não é contornada: trocar a **foto em si** continua sendo subir outra e apagar a antiga. No desktop, "Editar" abre a foto **na coluna da direita** (a mesma de "Subir uma foto", que volta com "Cancelar"), com a lista à esquerda, o cartão marcado e o salvamento no lugar, como em Notícias e Mensagens; no celular é tela própria (`/admin/galeria/:id/editar`), como "Apagar". A decisão precisa ser **confirmada com quem desenha**;
  - "sem JavaScript, tocar na foto abre a imagem" (11c) não se aplica a uma SPA: sem script não há página. A miniatura é um `<a>` para a imagem, que abre numa aba com Ctrl/Cmd.
- **Sem desenho, escrito aqui:** a frase de "Nenhuma foto enviada ainda" no painel e os dois avisos depois de subir (com e sem autorização).
- **Decidido aqui, a confirmar:** álbuns agrupados sem distinguir caixa nem acento; álbuns do mais recentemente publicado para o mais antigo e fotos na ordem em que foram ao ar; só imagem (vídeo não cabe no corpo da requisição); a frase do estado vazio público do desenho cita "fotos e vídeos".
- **Por quê:** RF05, RN07 e o pedido do grupo de que a equipe suba e publique o que aparece no site.
- **PR:** branch `feat/gallery`
## 2026-10-14 — Notícias e campanhas (RF04, desenhos 11e–11g, 11n e 11o)
- **Artefato:** Protótipos · Requisitos (RF04) · Arquitetura (nova tabela e rotas)
- **Antes:** o link "Notícias" do menu levava ao 404 e não havia como a equipe escrever ou publicar notícias.
- **Depois:** `/noticias` e `/noticias/:id` públicas, e `/admin/noticias` (lista com confirmação ao publicar e ao tirar do ar, escrever e editar) no painel. Back-end: tabela `news`, `GET /api/news` (só publicadas) e `/api/admin/news/*` (equipe). Escrever nunca publica; a data de publicação é carimbada na primeira vez e mantida ao tirar do ar; não há exclusão. A imagem, opcional, fica no disco do servidor e exige descrição e declaração de autorização de uso de imagem.
- **Diferenças em relação ao desenho, e por quê:**
  - o desenho não traz a declaração de autorização de imagem (regra de que nenhuma foto vai ao ar sem ela); foi acrescentada, obrigatória para subir a imagem;
  - "Remover imagem" foi acrescentado (sem ele só dá para trocar);
  - a lista da equipe no celular não tem desenho; foi adaptada ao padrão das mensagens e dos eventos;
  - "Compartilhar" não tem comportamento descrito: usa a folha de compartilhamento do aparelho e, sem ela, copia o endereço;
  - o desenho não pagina a lista pública; a implementação também não.
- **Decidido aqui, a confirmar:** o tipo Notícia/Campanha (`kind`) foi implementado porque o desenho o traz, mas ele próprio o marca como proposta ("só se a coluna existir"); o menu do painel diz "Notícias" (o desenho diz "Publicações" no menu e "Notícias" no título, e sugere "Notícias" nos dois); a coluna "Acompanhe também" do desktop segue o desenho, que pede para confirmar se fica.
- **Por quê:** RF04 e o pedido do grupo de que a equipe escreva e publique o que aparece no site.
- **PR:** branch `feat/news`

## 2026-10-16 — Perguntas frequentes, parte pública (desenhos 18a–18c)
- **Artefato:** Protótipos (rodada 18) · Requisitos (RF01)
- **Antes:** não havia página de perguntas frequentes, nem link para ela.
- **Depois:** `/perguntas-frequentes` com busca (filtra enquanto se digita, sem acento e sem caixa, com as respostas encontradas já abertas e a contagem), perguntas agrupadas em 4 temas com a lista de temas e a contagem de cada um no desktop, cada pergunta com endereço próprio (`#imagem`, que chega aberta) e o cartão "Ficou alguma dúvida?". Sem resultado, oferece WhatsApp e o formulário. Os pontos de entrada do 18c: link no rodapé e em "Ajuda" nos dois menus, e uma linha com a pergunta certa ao lado da autorização de imagem na inscrição, em "Para escolas", no topo da candidatura de voluntariado e acima do formulário de contato. Os dados estão em `lib/faq.ts`.
- **Diferenças em relação ao desenho, e por quê:**
  - **9 das 11 perguntas.** "Como posso apoiar o Ateliê?" e "Como peço para ver, corrigir ou apagar os meus dados?" ficaram de fora: a regra do desenho é que a resposta repita o que **já está escrito numa página do site**, e as páginas de origem (`/doar` e `/privacidade`) ainda não existem. Entram junto com elas;
  - da resposta sobre a ficha técnica saiu "em Projetos" (a página não existe, e um link para o 404 é pior que a ausência);
  - os temas da coluna lateral são links para a seção (o desenho os mostra como texto) e somem o link quando o tema fica sem resultado;
  - a faixa listrada sob o cabeçalho segue o desenho, o que contraria a regra de uma faixa por página (o rodapé já tem a sua);
  - a barra inferior do celular segue a do projeto (o desenho tem "Biblioteca").
- **Fica para depois (precisa de banco):** o painel das perguntas (18d–18f: criar, editar, ordenar, temas e tirar do ar). O desenho o pede como proposta, com duas tabelas novas; enquanto não existir, a lista mora no código.
- **Por quê:** o desenho da rodada 18 leva a dúvida certa para onde ela aparece; a parte pública não depende de banco.
- **PR:** branch `feat/faq-page`
