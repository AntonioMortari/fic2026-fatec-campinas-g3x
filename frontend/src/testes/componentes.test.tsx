import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { Abas, Botao, Campo, CampoSenha, FiltroEmChips, SeloDeData } from '../componentes/ui'
import { partesDaData } from '../compartilhado/datas'
import { destinoSeguro } from '../compartilhado/destino'
import { renderizarComRoteador } from './renderizar'

describe('Botao', () => {
  it('com `para` é link interno; com `href`, externo; sem nada, um <button type="button">', () => {
    renderizarComRoteador(
      <>
        <Botao para="/agenda">Ver a agenda</Botao>
        <Botao href="https://wa.me/5511953968344">WhatsApp</Botao>
        <Botao>Enviar</Botao>
      </>,
    )

    expect(screen.getByRole('link', { name: 'Ver a agenda' })).toHaveAttribute('href', '/agenda')
    expect(screen.getByRole('link', { name: 'WhatsApp' })).toHaveAttribute('href', 'https://wa.me/5511953968344')
    expect(screen.getByRole('button', { name: 'Enviar' })).toHaveAttribute('type', 'button')
  })
})

describe('Campo', () => {
  it('liga rótulo, dica e erro ao input', () => {
    render(<Campo rotulo="Seu WhatsApp" dica="Opcional. Com DDD." erro="Confira o número." />)
    const campo = screen.getByLabelText('Seu WhatsApp')

    expect(campo).toHaveAttribute('aria-invalid', 'true')
    expect(campo).toHaveAccessibleDescription('Confira o número. Opcional. Com DDD.')
  })

  it('sem erro não marca aria-invalid', () => {
    render(<Campo rotulo="E-mail" type="email" />)

    expect(screen.getByLabelText('E-mail')).not.toHaveAttribute('aria-invalid')
  })
})

describe('CampoSenha', () => {
  it('"Mostrar" troca o tipo do campo e diz o estado', async () => {
    const pessoa = userEvent.setup()
    render(<CampoSenha rotulo="Senha" />)
    const senha = screen.getByLabelText('Senha')
    const alternar = screen.getByRole('button', { name: 'Mostrar senha' })
    expect(senha).toHaveAttribute('type', 'password')

    await pessoa.click(alternar)

    expect(senha).toHaveAttribute('type', 'text')
    expect(screen.getByRole('button', { name: 'Ocultar senha' })).toHaveAttribute('aria-pressed', 'true')
  })
})

describe('Abas', () => {
  function Exemplo() {
    const [ativa, setAtiva] = useState('a')
    return (
      <Abas
        rotulo="Período"
        ativa={ativa}
        aoTrocar={setAtiva}
        abas={[
          { id: 'a', rotulo: 'Em breve', conteudo: 'Painel A' },
          { id: 'b', rotulo: 'Já aconteceu', conteudo: 'Painel B' },
        ]}
      />
    )
  }

  it('segue o padrão do WAI-ARIA: seta troca a aba e só a ativa entra no Tab', async () => {
    const pessoa = userEvent.setup()
    render(<Exemplo />)
    const [primeira, segunda] = screen.getAllByRole('tab')
    expect(primeira).toHaveAttribute('aria-selected', 'true')
    expect(segunda).toHaveAttribute('tabindex', '-1')

    primeira!.focus()
    await pessoa.keyboard('{ArrowRight}')

    expect(segunda).toHaveFocus()
    expect(segunda).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Painel B')
    expect(screen.getByRole('tabpanel')).toHaveAccessibleName('Já aconteceu')
  })
})

describe('FiltroEmChips', () => {
  it('expõe a escolha com aria-pressed', async () => {
    const pessoa = userEvent.setup()
    const aoSelecionar = vi.fn()
    render(
      <FiltroEmChips
        rotulo="Tipo"
        selecionado="todas"
        aoSelecionar={aoSelecionar}
        opcoes={[
          { valor: 'todas', rotulo: 'Todas', quantidade: 4 },
          { valor: 'oficina', rotulo: 'Oficina', quantidade: 1 },
        ]}
      />,
    )

    expect(screen.getByRole('button', { name: 'Todas 4' })).toHaveAttribute('aria-pressed', 'true')
    await pessoa.click(screen.getByRole('button', { name: 'Oficina 1' }))
    expect(aoSelecionar).toHaveBeenCalledWith('oficina')
  })
})

describe('datas no fuso da ONG', () => {
  it('perto da meia-noite UTC, vale o dia de São Paulo, não o do servidor', () => {
    // 01:30 UTC do dia 18 ainda é 22:30 do sábado, dia 17, em São Paulo.
    expect(partesDaData(new Date('2026-10-18T01:30:00Z'))).toMatchObject({ semana: 'SÁB', dia: '17', mes: 'OUT' })
  })

  it('o selo diz a data por extenso para o leitor de tela', () => {
    render(<SeloDeData data={new Date('2026-10-17T17:00:00Z')} destaque />)

    expect(screen.getByText('sábado, 17 de outubro')).toHaveClass('sr-only')
  })
})

describe('destino de "voltar"', () => {
  it.each([
    ['/voluntariado/candidatura', '/voluntariado/candidatura'],
    ['/agenda', '/agenda'],
  ])('aceita caminho interno %s', (entrada, esperado) => {
    expect(destinoSeguro(entrada)).toBe(esperado)
  })

  it.each([
    '//site-estranho.example',
    'https://site-estranho.example',
    '/\\site-estranho.example',
    '/agenda?x=1',
    '/%2F%2Fsite',
    '/entrar',
    '/nova-senha',
    'agenda',
    '',
    null,
  ])('recusa %s e volta para o início', (entrada) => {
    expect(destinoSeguro(entrada)).toBe('/')
  })
})
