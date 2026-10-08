import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react'
import { classes } from '../../compartilhado/classes'

/**
 * Abas segmentadas (Análise UX/UI, 2b "Em breve / Já aconteceu" e 3f
 * "Entrar / Criar conta"), no padrão de abas do WAI-ARIA: setas trocam de
 * aba, só a ativa entra na ordem do Tab, e cada aba aponta para o seu painel.
 */
export interface Aba {
  id: string
  rotulo: string
  conteudo: ReactNode
}

interface Props {
  abas: Aba[]
  ativa: string
  aoTrocar: (id: string) => void
  /** Nome do conjunto para o leitor de tela (ex.: "Período"). */
  rotulo: string
}

export function Abas({ abas, ativa, aoTrocar, rotulo }: Props) {
  const prefixo = useId()
  const botoes = useRef<(HTMLButtonElement | null)[]>([])

  function navegar(evento: KeyboardEvent<HTMLDivElement>) {
    const atual = abas.findIndex((aba) => aba.id === ativa)
    const destinos: Record<string, number> = {
      ArrowRight: (atual + 1) % abas.length,
      ArrowLeft: (atual - 1 + abas.length) % abas.length,
      Home: 0,
      End: abas.length - 1,
    }
    const proxima = destinos[evento.key]
    if (proxima === undefined) return
    evento.preventDefault()
    const aba = abas[proxima]
    if (!aba) return
    aoTrocar(aba.id)
    botoes.current[proxima]?.focus()
  }

  const painel = abas.find((aba) => aba.id === ativa)

  return (
    <div className="flex flex-col gap-4">
      <div
        role="tablist"
        aria-label={rotulo}
        onKeyDown={navegar}
        className="grid overflow-hidden rounded-controle border-[1.5px] border-marrom"
        style={{ gridTemplateColumns: `repeat(${abas.length}, minmax(0, 1fr))` }}
      >
        {abas.map((aba, indice) => {
          const selecionada = aba.id === ativa
          return (
            <button
              key={aba.id}
              ref={(elemento) => {
                botoes.current[indice] = elemento
              }}
              type="button"
              role="tab"
              id={`${prefixo}-aba-${aba.id}`}
              aria-selected={selecionada}
              aria-controls={`${prefixo}-painel-${aba.id}`}
              tabIndex={selecionada ? 0 : -1}
              onClick={() => aoTrocar(aba.id)}
              className={classes(
                'min-h-11 cursor-pointer px-3 text-[0.9375rem] font-semibold transition-colors duration-[90ms]',
                selecionada ? 'bg-marrom text-creme' : 'bg-transparent text-marrom',
              )}
            >
              {aba.rotulo}
            </button>
          )
        })}
      </div>
      {painel && (
        <div
          role="tabpanel"
          id={`${prefixo}-painel-${painel.id}`}
          aria-labelledby={`${prefixo}-aba-${painel.id}`}
          tabIndex={0}
          className="animate-subir"
        >
          {painel.conteudo}
        </div>
      )}
    </div>
  )
}
