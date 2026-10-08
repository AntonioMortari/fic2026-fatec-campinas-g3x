import { useState } from 'react'
import { Campo, type PropsDoCampo } from './Campo'

/**
 * Campo de senha com "Mostrar" DENTRO da caixa (Análise UX/UI, tela 3f), e
 * não um botão solto ao lado. O botão diz o que vai fazer ("Mostrar" /
 * "Ocultar") e expõe o estado com aria-pressed.
 */
export function CampoSenha(props: Omit<PropsDoCampo, 'type' | 'acessorio'>) {
  const [visivel, setVisivel] = useState(false)

  return (
    <Campo
      {...props}
      type={visivel ? 'text' : 'password'}
      autoCapitalize="none"
      spellCheck={false}
      acessorio={
        <button
          type="button"
          aria-pressed={visivel}
          aria-label={visivel ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisivel((v) => !v)}
          className="mr-1 inline-flex min-h-11 cursor-pointer items-center px-3 text-secundario font-semibold text-azul-escuro"
        >
          {visivel ? 'Ocultar' : 'Mostrar'}
        </button>
      }
    />
  )
}
