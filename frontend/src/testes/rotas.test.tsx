import { act, screen } from '@testing-library/react'
import { abrirRota } from './renderizar'

describe('rotas (RNF-FE-04)', () => {
  it('a página inicial tem um único título principal', () => {
    abrirRota('/')

    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Arte, memória e pertencimento')
  })

  it('endereço desconhecido mostra a página de não encontrada com caminho de volta', () => {
    abrirRota('/endereco-que-nao-existe')

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Página não encontrada')
    expect(screen.getByRole('link', { name: 'Voltar para o início' })).toHaveAttribute('href', '/')
  })

  it('o conteúdo fica dentro do <main> que o link de pular alveja', () => {
    abrirRota('/')

    expect(screen.getByRole('main')).toHaveAttribute('id', 'conteudo')
    expect(screen.getByRole('link', { name: 'Pular para o conteúdo' })).toHaveAttribute('href', '#conteudo')
  })
})

describe('foco na troca de página', () => {
  it('não rouba o foco na carga, mas leva ao <main> quando a rota muda', async () => {
    const roteador = abrirRota('/')
    expect(screen.getByRole('main')).not.toHaveFocus()

    await act(() => roteador.navigate('/outra-pagina'))

    expect(screen.getByRole('main')).toHaveFocus()
  })
})
