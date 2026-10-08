import { Button, PageHeader } from '../components/ui'

export function Home() {
  return (
    <PageHeader
      overline="Casa Verde · São Paulo"
      title={
        <>
          Arte, memória e <em className="text-ochre-deep not-italic">pertencimento</em> — feitos à mão, todo dia
        </>
      }
      lead="Espaço educativo de criação, reflexão e valorização da cultura e memória afro brasileira."
      action={<Button to="/projetos">Conhecer nossos projetos</Button>}
    />
  )
}
