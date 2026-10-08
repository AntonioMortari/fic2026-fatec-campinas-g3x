import { Botao, CabecalhoDaPagina } from '../componentes/ui'

export function NaoEncontrada() {
  return (
    <CabecalhoDaPagina
      titulo="Página não encontrada"
      lead="O endereço pode ter mudado, ou esta parte do site ainda está sendo construída."
      acao={
        <Botao para="/" variante="secundario">
          Voltar para o início
        </Botao>
      }
    />
  )
}
