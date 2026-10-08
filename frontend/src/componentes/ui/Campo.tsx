import { useId, type InputHTMLAttributes, type ReactNode } from 'react'
import { classes } from '../../compartilhado/classes'

/**
 * Campo de formulário (Análise UX/UI, "Campo de formulário"):
 * 52px de altura e fonte de 16px — abaixo disso o iOS dá zoom ao focar;
 * borda leve em repouso, marrom com anel azul no foco.
 *
 * O rótulo é sempre um <label> visível ligado ao campo. Dica e erro são
 * ligados por aria-describedby, para o leitor de tela ler junto. O erro não
 * depende de cor: é texto em negrito e borda mais grossa.
 */
export interface PropsDoCampo extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  rotulo: string
  dica?: ReactNode
  erro?: string
  /** Conteúdo dentro da caixa, à direita (ex.: "Mostrar" da senha). */
  acessorio?: ReactNode
  id?: string
}

export const ESTILO_DA_CAIXA =
  'flex items-center min-h-13 bg-cartao rounded-controle border border-linha-campo ' +
  'focus-within:border-[1.5px] focus-within:border-marrom focus-within:shadow-foco'

export function Campo({ rotulo, dica, erro, acessorio, id, className, ...input }: PropsDoCampo) {
  const gerado = useId()
  const idDoCampo = id ?? gerado
  const idDaDica = dica ? `${idDoCampo}-dica` : undefined
  const idDoErro = erro ? `${idDoCampo}-erro` : undefined
  const descritoPor = [idDoErro, idDaDica].filter(Boolean).join(' ') || undefined

  return (
    <div className={classes('flex flex-col gap-1.5', className)}>
      <label htmlFor={idDoCampo} className="text-[0.9375rem] font-semibold">
        {rotulo}
        {input.required && <span aria-hidden="true"> *</span>}
      </label>
      <div className={classes(ESTILO_DA_CAIXA, erro && 'border-2 border-marrom')}>
        <input
          id={idDoCampo}
          aria-invalid={erro ? true : undefined}
          aria-describedby={descritoPor}
          className="min-h-13 w-full min-w-0 flex-1 bg-transparent px-3.5 text-corpo text-marrom outline-none placeholder:text-marrom-300"
          {...input}
        />
        {acessorio}
      </div>
      {erro && (
        <p id={idDoErro} className="m-0 text-secundario font-bold">
          {erro}
        </p>
      )}
      {dica && (
        <p id={idDaDica} className="m-0 text-secundario text-marrom-400">
          {dica}
        </p>
      )}
    </div>
  )
}
