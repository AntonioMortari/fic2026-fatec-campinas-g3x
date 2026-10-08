import { createContext } from 'react'

export const PASSO_MINIMO = -1
export const PASSO_MAXIMO = 3

export const CHAVE_FONTE = 'af-fonte'
export const CHAVE_CONTRASTE = 'af-contraste'

export interface PreferenciasDeLeitura {
  /** −1 (87,5%) · 0 (100%) · 1 (112,5%) · 2 (125%) · 3 (137,5%) */
  passoDaFonte: number
  altoContraste: boolean
  diminuirFonte: () => void
  fonteNormal: () => void
  aumentarFonte: () => void
  alternarContraste: () => void
}

export const ContextoDeLeitura = createContext<PreferenciasDeLeitura | null>(null)
