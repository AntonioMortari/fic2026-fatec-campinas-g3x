import { useContext } from 'react'
import { ContextoDeLeitura, type PreferenciasDeLeitura } from './contextoDeLeitura'

export function usePreferenciasDeLeitura(): PreferenciasDeLeitura {
  const contexto = useContext(ContextoDeLeitura)
  if (!contexto) throw new Error('usePreferenciasDeLeitura precisa estar dentro de <ProvedorDeLeitura>')
  return contexto
}
