import { Link } from 'react-router-dom'

export function NaoEncontrada() {
  return (
    <section>
      <h1>Página não encontrada</h1>
      <p>
        O endereço pode ter mudado. <Link to="/">Voltar para o início</Link>
      </p>
    </section>
  )
}
