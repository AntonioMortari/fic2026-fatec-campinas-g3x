import { useState, type ReactNode } from 'react'
import {
  Abas,
  Botao,
  CabecalhoDaPagina,
  Campo,
  CampoSenha,
  Cartao,
  EstadoVazio,
  FiltroEmChips,
  ItemDeLista,
  SeloDeData,
} from '../componentes/ui'
import { CONTATOS } from '../compartilhado/contatos'

/**
 * Catálogo do design system (Plano de Migração, F1.5). Só existe em
 * desenvolvimento (ver rotas.tsx): é a bancada para conferir cada
 * componente a 390px e a 1440px antes de usá-lo numa tela.
 *
 * Os nomes de atividade são reais; DATAS, VAGAS E HORÁRIOS SÃO EXEMPLOS,
 * como na própria Análise UX/UI — nada daqui vai para uma página pública.
 */
const CORES = [
  ['ocre', 'bg-ocre', 'ação "Apoiar", estado ativo, contagem e data'],
  ['ocre-escuro', 'bg-ocre-escuro', 'texto ocre sobre creme (sobretítulo)'],
  ['azul', 'bg-azul', 'anel de foco, faixa listrada'],
  ['azul-escuro', 'bg-azul-escuro', 'links e rótulo de categoria'],
  ['marrom', 'bg-marrom', 'texto e ação principal'],
  ['marrom-400', 'bg-marrom-400', 'texto secundário'],
  ['creme', 'bg-creme', 'superfície dominante'],
  ['cartao', 'bg-cartao', 'cartões e campos'],
] as const

function Secao({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-t border-linha py-8">
      <h2 className="m-0 text-h2 font-bold desktop:text-h2-desktop">{titulo}</h2>
      {children}
    </section>
  )
}

export function CatalogoDeComponentes() {
  const [aba, setAba] = useState('em-breve')
  const [filtro, setFiltro] = useState('todas')

  return (
    <>
      <CabecalhoDaPagina
        sobretitulo="Só em desenvolvimento"
        titulo="Catálogo do design system"
        lead="Cada componente base, no estado em que as telas vão usá-lo. Datas, vagas e horários são exemplos."
      />

      <Secao titulo="Cores">
        <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 desktop:grid-cols-4">
          {CORES.map(([nome, fundo, uso]) => (
            <li key={nome} className="flex flex-col gap-1">
              <span className={`h-14 border border-linha ${fundo}`} />
              <strong className="text-secundario">{nome}</strong>
              <span className="text-secundario text-marrom-400">{uso}</span>
            </li>
          ))}
        </ul>
      </Secao>

      <Secao titulo="Tipografia">
        <p className="m-0 text-sobretitulo font-semibold uppercase tracking-[0.12em] text-ocre-escuro">Sobretítulo · 12px</p>
        <p className="m-0 text-h1 font-bold">H1 · 32px</p>
        <p className="m-0 text-h2 font-bold">H2 de seção · 22px</p>
        <p className="m-0 text-h3 font-bold">H3 / item · 18px</p>
        <p className="m-0 text-corpo">Corpo · 16px. Tamanhos em rem: acompanham o A−/A/A+ do menu.</p>
        <p className="m-0 text-secundario text-marrom-400">Secundário · 14px</p>
      </Secao>

      <Secao titulo="Botões">
        <div className="flex flex-wrap gap-3">
          <Botao variante="aplique">Quero me inscrever</Botao>
          <Botao>Conhecer nossos projetos</Botao>
          <Botao variante="secundario">Secundário</Botao>
          <Botao variante="apoio">Apoiar</Botao>
          <Botao variante="secundario" tamanho="compacto" href={CONTATOS.instagram}>
            Instagram
          </Botao>
          <Botao disabled>Enviando…</Botao>
        </div>
      </Secao>

      <Secao titulo="Elevação em 3 níveis">
        <div className="grid gap-4 desktop:grid-cols-3">
          <Cartao className="p-4">
            <strong>Plano</strong>
            <p className="m-0 text-secundario text-marrom-400">Listas, cartões comuns, campos.</p>
          </Cartao>
          <Cartao nivel="contorno" className="p-4">
            <strong>Contorno</strong>
            <p className="m-0 text-secundario text-marrom-400">Botão secundário, foco, seleção.</p>
          </Cartao>
          <Cartao nivel="aplique" className="p-4">
            <strong>Aplique</strong>
            <p className="m-0 text-secundario text-marrom-400">No máximo um por tela: o destaque.</p>
          </Cartao>
        </div>
      </Secao>

      <Secao titulo="Campos">
        <form className="flex max-w-md flex-col gap-4" onSubmit={(evento) => evento.preventDefault()}>
          <Campo rotulo="Seu WhatsApp" dica="Opcional. Com DDD." type="tel" inputMode="tel" autoComplete="tel" />
          <Campo rotulo="E-mail" type="email" autoComplete="email" required placeholder="voce@exemplo.com" />
          <Campo rotulo="Nome" erro="Escreva o seu nome." defaultValue="" />
          <CampoSenha rotulo="Senha" autoComplete="current-password" />
        </form>
      </Secao>

      <Secao titulo="Abas e filtro">
        <Abas
          rotulo="Período"
          ativa={aba}
          aoTrocar={setAba}
          abas={[
            { id: 'em-breve', rotulo: 'Em breve', conteudo: <p className="m-0">Painel "Em breve".</p> },
            { id: 'ja-aconteceu', rotulo: 'Já aconteceu', conteudo: <p className="m-0">Painel "Já aconteceu".</p> },
          ]}
        />
        <FiltroEmChips
          rotulo="Tipo de atividade"
          selecionado={filtro}
          aoSelecionar={setFiltro}
          opcoes={[
            { valor: 'todas', rotulo: 'Todas', quantidade: 4 },
            { valor: 'contacao', rotulo: 'Contação', quantidade: 2 },
            { valor: 'apresentacao', rotulo: 'Apresentação', quantidade: 1 },
            { valor: 'oficina', rotulo: 'Oficina', quantidade: 1 },
          ]}
        />
      </Secao>

      <Secao titulo="Cartão de evento e data">
        <Cartao nivel="aplique" como="article" className="max-w-md">
          <div className="flex gap-3.5 p-4">
            <SeloDeData data={new Date('2026-10-17T17:00:00Z')} destaque />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-azul-escuro">Contação de história</span>
              <h3 className="m-0 text-[1.1875rem] leading-tight font-bold">Cafú e o Café</h3>
              <span className="text-secundario text-marrom-400">14h · Sede, Vila Romero · Livre</span>
            </div>
          </div>
          <div className="px-4 pb-4">
            <Botao larguraTotal tamanho="compacto" className="min-h-12">
              Quero me inscrever
            </Botao>
          </div>
        </Cartao>
        <Cartao como="article" className="flex max-w-md gap-3.5 p-4">
          <SeloDeData data={new Date('2026-10-31T22:00:00Z')} />
          <div className="flex flex-col gap-1">
            <span className="text-[0.6875rem] font-semibold uppercase tracking-[0.1em] text-azul-escuro">Apresentação</span>
            <h3 className="m-0 text-[1.1875rem] leading-tight font-bold">Brasil Negreiro</h3>
          </div>
        </Cartao>
      </Secao>

      <Secao titulo="Lista navegável">
        <ul className="m-0 max-w-xl list-none p-0">
          <ItemDeLista numero="01" tom="ocre" titulo="Conhecer" descricao="Nossa história e os três setores." para="/quem-somos" />
          <ItemDeLista numero="02" tom="azul" titulo="Participar" descricao="Oficinas e vivências. Inscrição sem cadastro." para="/agenda" />
          <ItemDeLista numero="03" tom="marrom" titulo="Ser voluntário" descricao="Cinco áreas, do pedagógico ao acervo." para="/voluntariado" />
          <ItemDeLista numero="04" tom="ocre" titulo="Apoiar" descricao="Livros, instrumentos, materiais e recursos." para="/doar" />
        </ul>
      </Secao>

      <Secao titulo="Estado vazio">
        <EstadoVazio
          titulo="Nenhuma atividade marcada por enquanto"
          texto="Acompanhe as novidades por onde preferir."
          acoes={
            <>
              <Botao variante="secundario" tamanho="compacto" href={CONTATOS.instagram}>
                Instagram
              </Botao>
              <Botao variante="secundario" tamanho="compacto" href={CONTATOS.whatsapp}>
                WhatsApp
              </Botao>
            </>
          }
        />
      </Secao>
    </>
  )
}
