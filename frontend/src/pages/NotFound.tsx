import { Button, PageHeader } from '../components/ui'

export function NotFound() {
  return (
    <PageHeader
      title="Página não encontrada"
      lead="O endereço pode ter mudado, ou esta parte do site ainda está sendo construída."
      action={
        <Button to="/" variant="secondary">
          Voltar para o início
        </Button>
      }
    />
  )
}
