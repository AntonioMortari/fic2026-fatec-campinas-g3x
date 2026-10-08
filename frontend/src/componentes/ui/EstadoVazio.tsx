import type { ReactNode } from 'react'

/**
 * Estado vazio padrão (Análise UX/UI, 2b): diz o que não há e oferece
 * botões — não um texto com instrução. Borda tracejada para não ser
 * confundido com um item da lista.
 */
interface Props {
  titulo: string
  texto?: ReactNode
  /** Botões de saída (secundários, compactos). */
  acoes?: ReactNode
}

export function EstadoVazio({ titulo, texto, acoes }: Props) {
  return (
    <div role="status" className="flex flex-col items-start gap-2.5 border-[1.5px] border-dashed border-marrom-300 px-4.5 py-5.5">
      <p className="m-0 text-item font-bold">{titulo}</p>
      {texto && <p className="m-0 text-[0.9375rem] text-marrom-600">{texto}</p>}
      {acoes && <div className="flex flex-wrap gap-2">{acoes}</div>}
    </div>
  )
}
