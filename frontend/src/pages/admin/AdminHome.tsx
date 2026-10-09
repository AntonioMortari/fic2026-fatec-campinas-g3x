import { Container, ListItem, PageHeader } from '../../components/ui'

export function AdminHome() {
  return (
    <Container className="pb-12">
      <PageHeader overline="Equipe" title="Painel da equipe" lead="O que a equipe faz sozinha, pelo celular." />
      <ul className="m-0 max-w-xl list-none border-t border-line p-0">
        <ListItem to="/admin/eventos" number="01" title="Eventos" description="Cadastrar, corrigir e publicar as atividades da agenda." />
      </ul>
    </Container>
  )
}
