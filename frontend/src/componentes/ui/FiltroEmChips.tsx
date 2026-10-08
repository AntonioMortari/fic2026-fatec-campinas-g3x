import { classes } from '../../compartilhado/classes'

/**
 * Filtro em chips (Análise UX/UI, 3b e 4b): escolha única por toque, com a
 * contagem ao lado. É um grupo de botões com aria-pressed — o estado é lido
 * pelo leitor de tela, e não só pela cor do chip.
 */
export interface OpcaoDeFiltro {
  valor: string
  rotulo: string
  quantidade?: number
}

interface Props {
  opcoes: OpcaoDeFiltro[]
  selecionado: string
  aoSelecionar: (valor: string) => void
  rotulo: string
}

export function FiltroEmChips({ opcoes, selecionado, aoSelecionar, rotulo }: Props) {
  return (
    <div role="group" aria-label={rotulo} className="flex gap-2 overflow-x-auto pb-1 desktop:flex-wrap">
      {opcoes.map((opcao) => {
        const ativo = opcao.valor === selecionado
        return (
          <button
            key={opcao.valor}
            type="button"
            aria-pressed={ativo}
            onClick={() => aoSelecionar(opcao.valor)}
            className={classes(
              'inline-flex min-h-11 flex-none cursor-pointer items-center gap-1.5 rounded-full border-[1.5px] border-marrom px-3.5 text-secundario font-semibold',
              ativo ? 'bg-marrom text-creme' : 'bg-cartao text-marrom',
            )}
          >
            {opcao.rotulo}
            {opcao.quantidade !== undefined && ' '}
            {opcao.quantidade !== undefined && (
              <span className={classes('text-[0.8125rem]', ativo ? 'text-creme-apagado' : 'text-marrom-400')}>
                {opcao.quantidade}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
