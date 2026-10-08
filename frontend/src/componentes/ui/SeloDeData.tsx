import { classes } from '../../compartilhado/classes'
import { partesDaData } from '../../compartilhado/datas'

/**
 * Bloco de data (Análise UX/UI, 2a/2b): dia da semana, dia e mês, sempre no
 * fuso da ONG (compartilhado/datas.ts). Ocre é reservado ao próximo evento; os demais usam o creme
 * escuro. O leitor de tela ouve a data por extenso, não "SÁB 18 OUT".
 */
interface Props {
  data: Date
  destaque?: boolean
  tamanho?: 'normal' | 'grande'
}

export function SeloDeData({ data, destaque = false, tamanho = 'normal' }: Props) {
  const { semana, dia, mes, porExtenso } = partesDaData(data)
  return (
    <span
      className={classes(
        'flex flex-none flex-col items-center justify-center text-marrom',
        destaque ? 'bg-ocre' : 'bg-creme-escuro',
        tamanho === 'grande' ? 'h-24 w-21' : 'h-19 w-16',
      )}
    >
      <span className="sr-only">{porExtenso}</span>
      <span aria-hidden="true" className="text-[0.6875rem] font-semibold tracking-[0.1em]">{semana}</span>
      <span aria-hidden="true" className={classes('leading-none font-bold', tamanho === 'grande' ? 'text-[2.125rem]' : 'text-[1.625rem]')}>
        {dia}
      </span>
      <span aria-hidden="true" className="text-[0.6875rem] font-semibold tracking-[0.1em]">{mes}</span>
    </span>
  )
}
