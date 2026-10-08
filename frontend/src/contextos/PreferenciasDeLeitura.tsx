import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import { CHAVE_CONTRASTE, CHAVE_FONTE, ContextoDeLeitura, PASSO_MAXIMO, PASSO_MINIMO } from './contextoDeLeitura'

/**
 * Tamanho do texto (A−/A/A+) e alto contraste — a acessibilidade que a ONG
 * pediu ("áudio, textos grandes, contraste"). O estado mora aqui (Context
 * API) e é aplicado como atributo no <html>: `data-fonte` muda o font-size
 * da raiz, e como todo texto do sistema está em rem, tudo acompanha;
 * `data-contraste` troca os tokens de cor (ver estilos.css).
 *
 * A escolha é guardada no aparelho. O script em index.html reaplica antes da
 * primeira pintura, para a página não "piscar" no tamanho padrão.
 */

function ler(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

function gravar(chave: string, valor: string | null) {
  try {
    if (valor === null) localStorage.removeItem(chave)
    else localStorage.setItem(chave, valor)
  } catch {
    // Aba anônima ou armazenamento bloqueado: a preferência vale só nesta visita.
  }
}

function passoInicial(): number {
  const passo = Number(ler(CHAVE_FONTE))
  return Number.isInteger(passo) && passo >= PASSO_MINIMO && passo <= PASSO_MAXIMO ? passo : 0
}

export function ProvedorDeLeitura({ children }: { children: ReactNode }) {
  const [passoDaFonte, setPassoDaFonte] = useState(passoInicial)
  const [altoContraste, setAltoContraste] = useState(() => ler(CHAVE_CONTRASTE) === 'alto')

  useEffect(() => {
    const raiz = document.documentElement
    if (passoDaFonte === 0) raiz.removeAttribute('data-fonte')
    else raiz.setAttribute('data-fonte', String(passoDaFonte))
    gravar(CHAVE_FONTE, passoDaFonte === 0 ? null : String(passoDaFonte))
  }, [passoDaFonte])

  useEffect(() => {
    const raiz = document.documentElement
    if (altoContraste) raiz.setAttribute('data-contraste', 'alto')
    else raiz.removeAttribute('data-contraste')
    gravar(CHAVE_CONTRASTE, altoContraste ? 'alto' : null)
  }, [altoContraste])

  const diminuirFonte = useCallback(() => setPassoDaFonte((p) => Math.max(PASSO_MINIMO, p - 1)), [])
  const fonteNormal = useCallback(() => setPassoDaFonte(0), [])
  const aumentarFonte = useCallback(() => setPassoDaFonte((p) => Math.min(PASSO_MAXIMO, p + 1)), [])
  const alternarContraste = useCallback(() => setAltoContraste((a) => !a), [])

  const valor = useMemo(
    () => ({ passoDaFonte, altoContraste, diminuirFonte, fonteNormal, aumentarFonte, alternarContraste }),
    [passoDaFonte, altoContraste, diminuirFonte, fonteNormal, aumentarFonte, alternarContraste],
  )

  return <ContextoDeLeitura.Provider value={valor}>{children}</ContextoDeLeitura.Provider>
}
