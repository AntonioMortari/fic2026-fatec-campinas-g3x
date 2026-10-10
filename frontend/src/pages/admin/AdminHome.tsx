import { Link } from 'react-router-dom'
import { Container, ListItem, PageHeader } from '../../components/ui'
import { ADMIN_QUICK_ACTIONS, ADMIN_SCREENS } from '../../lib/admin-navigation'

export function AdminHome() {
  return (
    <Container className="pb-12">
      <PageHeader overline="Equipe" title="Painel da equipe" lead="O que a equipe faz sozinha, pelo celular." />

      <div className="flex max-w-xl flex-col gap-7">
        <section aria-labelledby="quick-actions" className="flex flex-col gap-3">
          <h2 id="quick-actions" className="m-0 text-h2 font-bold">
            Ações rápidas
          </h2>
          <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0">
            {ADMIN_QUICK_ACTIONS.map((action, index) => (
              <li key={action.to} className="[&:last-child:nth-child(odd)]:col-span-2">
                <Link
                  to={action.to}
                  className={
                    index === 0
                      ? 'flex min-h-24 items-end border-[1.5px] border-brown bg-brown p-4 text-item font-bold text-cream no-underline transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-brown-800 hover:text-cream'
                      : 'flex min-h-24 items-end border-[1.5px] border-brown p-4 text-item font-bold text-brown no-underline transition-[transform,background-color] hover:-translate-y-0.5 hover:bg-hover hover:text-brown'
                  }
                >
                  {action.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="all-screens" className="flex flex-col gap-1">
          <h2 id="all-screens" className="m-0 text-h2 font-bold">
            Todas as telas
          </h2>
          <ul className="m-0 list-none border-t border-line p-0">
            {ADMIN_SCREENS.map((screen) => (
              <ListItem key={screen.to} to={screen.to} title={screen.label} description={screen.description} />
            ))}
          </ul>
        </section>
      </div>
    </Container>
  )
}
