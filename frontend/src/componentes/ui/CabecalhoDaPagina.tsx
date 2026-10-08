import type { ReactNode } from 'react'

/**
 * Anatomia padrão de página (Análise UX/UI, 2b): sobretítulo (a seção do
 * menu) → H1 → lead de 1–2 linhas → ação principal, se houver. Substitui o
 * h1 + parágrafo com borda que cada tela do site antigo montava do seu jeito.
 */
interface Props {
  sobretitulo?: string
  titulo: ReactNode
  lead?: ReactNode
  /** Ação principal da página, se houver (um <Botao>). */
  acao?: ReactNode
  /** Conteúdo à direita do título no desktop (ex.: abas). */
  lateral?: ReactNode
}

export function CabecalhoDaPagina({ sobretitulo, titulo, lead, acao, lateral }: Props) {
  return (
    <header className="flex flex-col gap-2.5 pt-6 pb-5 desktop:flex-row desktop:items-end desktop:justify-between desktop:gap-10 desktop:pt-12 desktop:pb-8">
      <div className="flex max-w-3xl flex-col gap-2.5">
        {sobretitulo && (
          <p className="m-0 text-sobretitulo font-semibold uppercase tracking-[0.12em] text-ocre-escuro">{sobretitulo}</p>
        )}
        <h1 className="m-0 text-h1 font-bold text-pretty desktop:text-h1-desktop">{titulo}</h1>
        {lead && <p className="m-0 text-corpo text-marrom-600 desktop:text-lg">{lead}</p>}
        {acao && <div className="mt-2">{acao}</div>}
      </div>
      {lateral && <div className="mt-3 desktop:mt-0">{lateral}</div>}
    </header>
  )
}
