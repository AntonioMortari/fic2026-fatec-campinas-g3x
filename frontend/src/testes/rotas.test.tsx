import { render, screen } from '@testing-library/react'
import { RouterProvider, createMemoryRouter } from 'react-router-dom'
import { rotas } from '../rotas'

function abrir(endereco: string) {
  render(<RouterProvider router={createMemoryRouter(rotas, { initialEntries: [endereco] })} />)
}

describe('rotas (RNF-FE-04)', () => {
  it('a página inicial tem um único título principal', () => {
    abrir('/')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Ateliê Afro Cultural')
  })

  it('endereço desconhecido mostra a página de não encontrada com caminho de volta', () => {
    abrir('/endereco-que-nao-existe')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  })

  it('o conteúdo fica dentro do <main> que o link de pular vai alvejar', () => {
    abrir('/')

    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
  })
})
