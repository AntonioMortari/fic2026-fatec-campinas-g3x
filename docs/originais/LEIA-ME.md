# Ateliê Afro Cultural — pacote de Submissão Institucional

**Fatec Innovation Challenge 2026 · Venturus**
Etapa 3 — Submissão Institucional · 4 de setembro de 2026

O sistema está **no ar** em <https://www.atelieafrocultural.site>

> Em redes do governo do estado de São Paulo — a da própria Fatec, inclusive — esse
> endereço responde **403**: é bloqueio do firewall da rede, não do site. Nessas redes,
> use <https://venturus-atelie.vercel.app>, que serve a mesma aplicação.

---

## O que é este projeto

Um site institucional e um sistema de gestão para o **Ateliê Afro Cultural**, ONG de arte,
cultura e memória afro-brasileira na Casa Verde, zona norte de São Paulo.

Duas restrições da organização moldaram quase todas as decisões técnicas:

1. **A ONG não possui computador.** Toda a operação acontece no celular pessoal da equipe,
   muitas vezes de pé, no meio de um evento. Por isso o painel é *mobile-first* de verdade —
   e a lista de presença, que é a tela mais extrema, funciona **sem JavaScript**, com internet
   de galpão.

2. **O público começa aos 10 anos.** Isso torna a proteção de dados uma restrição de
   arquitetura, e não um item de checklist: nenhuma foto vai ao ar sem autorização registrada,
   e o dado pessoal de terceiros é recusado pelo banco de dados em duas camadas antes de
   qualquer código nosso ser consultado.

---

## Onde está cada entregável

A estrutura segue o **Anexo I §3.1** do Regulamento Técnico.

| Pasta | Entregável | Como abrir |
|---|---|---|
| **`01_Proposta/`** | **Proposta de Impacto** — o problema que o projeto resolve, *nas palavras da própria ONG*: cada afirmação é citação literal do formulário que ela respondeu, com a seção de origem | `Proposta_Impacto.pdf` |
| **`02_Documentacao_Tecnica/01_Requisitos/`** | **Documento de Requisitos** — Introdução, seis Perfis de Usuário, o Backlog em 9 Épicos e 39 User Stories com critérios de aceitação, os 30 Requisitos Não Funcionais do Anexo III, e a seção que explica onde o projeto diverge da stack obrigatória | `Documento_Requisitos.pdf` |
| **`02_Documentacao_Tecnica/02_Arquitetura/`** | **Diagrama de Arquitetura** em Mermaid, código-fonte e imagem | `Diagrama_Arquitetura.md` — o principal também isolado em `.mmd` e `.png`; os outros três, em `diagramas/` e `renderizado/` |
| **`02_Documentacao_Tecnica/03_Prototipos/`** | **Protótipos da Interface** — as telas do sistema em duas larguras | `index.html` — **abre sem internet**, e cada captura amplia com um clique. O `LEIA-ME.txt` ao lado explica a escolha do formato |
| **`03_Video_Defesa/`** | **Vídeo de Defesa** — o endereço no YouTube | `Link_Video.txt` |

---

## Quatro coisas que valem saber antes de abrir

**Os protótipos não são maquetes.** São capturas do sistema rodando, com o banco de dados
real da ONG. A consequência é que o protótipo não consegue mostrar uma tela que não funcione —
e as telas que não foram capturadas aparecem no índice dizendo por quê, em vez de sumir.

**A linha "Como se sabe" do documento de requisitos é o ponto dele.** "Pronto" sem dizer
como se verificou é promessa, não relatório. Ali está o que foi feito para saber: teste
automatizado, medição contra o banco de produção, ou navegador — e, onde ninguém percorreu o
caminho até o fim, está escrito que ninguém percorreu.

**A divergência de stack está declarada, e não escondida.** Este projeto foi construído com
renderização no servidor sobre PostgreSQL, e não com Express sobre MySQL. A seção 5 do
Documento de Requisitos diz por quê, o que a decisão custou e o que se ganhou. Preferimos a
divergência argumentada à omitida: a segunda é descoberta abrindo a lista de dependências, e
aí já não há argumento.

**A proposta de impacto não estima número de alcance, e a ausência é deliberada.** A
organização nunca mediu nada — *"todos os nossos processos atualmente são feitos de maneira
manual"* —, então qualquer número seria uma linha de base inventada. O que ela diz no lugar é
verificável: quais medições passam a existir, e por que antes não existiam.

---

## Verificação

| | |
|---|---|
| Testes automatizados, modo offline | **1268**, zero falhas |
| Testes contra o banco de produção | **1269**, zero falhas |
| Testes de política de acesso contra PostgreSQL real | **118**, zero falhas |
| Conformidade deste pacote com o Regulamento Técnico | teste automatizado, 28 asserções |
| Navegador | Firefox, com e **sem** JavaScript, a 375px e 1280px |

A última linha é incomum e vale explicar: **as exigências do regulamento viraram teste**. O
Anexo I, o Anexo III e o Anexo V estão codificados em `testes/entrega-fic.test.mjs`, no
repositório, cada asserção citando a cláusula que a obriga. É o mesmo princípio que governa a
suíte do sistema — afirmação sobre a *relação* entre duas pontas não envelhece, e uma
estrutura de pastas que divirja do anexo não passa despercebida.

---

*Pacote gerado a partir do repositório por `npm run entrega`.*
