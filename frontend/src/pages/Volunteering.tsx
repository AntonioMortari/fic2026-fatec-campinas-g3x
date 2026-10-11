import { Link } from 'react-router-dom'
import { AreaOverview } from '../components/volunteering/AreaOverview'
import { OrderedSteps } from '../components/volunteering/OrderedSteps'
import { Button, Container, EmptyState, PageHeader } from '../components/ui'
import { ADULT_NOTE, APPLICATION_PATH, HOW_IT_WORKS_STEPS } from '../lib/volunteering'
import { useVolunteerAreas } from '../services/volunteering'

function Actions({ className }: { className: string }) {
  return (
    <div className={className}>
      <Button to={APPLICATION_PATH} variant="applique" className="min-h-12! whitespace-nowrap px-7 text-[0.9375rem] desktop:min-h-13! desktop:text-body">
        Quero me candidatar
      </Button>
      <Link to="/contato" className="inline-flex min-h-11 items-center text-[0.9375rem] font-semibold whitespace-nowrap">
        Tenho uma dúvida
      </Link>
    </div>
  )
}

export function Volunteering() {
  const areas = useVolunteerAreas()

  return (
    <>
      <Container className="pb-10 desktop:pb-18">
        <PageHeader
          overline="Participar"
          overlineTone="blue"
          title="Ser voluntário no Ateliê"
          lead="Voluntariar aqui é somar com a gente na criação, na reflexão e na valorização da cultura e memória afro brasileira. Não é preciso experiência prévia — é preciso vontade de participar e compromisso com o que combinamos."
        />

        <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-[minmax(0,1fr)_25rem] desktop:items-start desktop:gap-x-16">
          <section aria-labelledby="areas-title" className="flex flex-col gap-1.5">
            <h2 id="areas-title" className="m-0 text-h2 leading-[1.2] font-bold">
              Onde você pode ajudar
            </h2>
            <p className="m-0 mb-0.5 text-[0.9375rem] leading-[1.2] text-brown-400">Escolha uma ou mais áreas. Muita gente atua em duas.</p>
            {areas.isPending && (
              <p role="status" className="m-0 text-brown-400">
                Carregando as áreas…
              </p>
            )}
            {areas.isError && (
              <EmptyState
                tone="error"
                title="Não conseguimos carregar as áreas agora"
                text="Tente de novo em instantes."
                actions={
                  <Button variant="secondary" size="compact" onClick={() => void areas.refetch()}>
                    Tentar de novo
                  </Button>
                }
              />
            )}
            {areas.data && <AreaOverview areas={areas.data} />}
          </section>

          <section aria-labelledby="how-title" className="flex flex-col gap-2.5 border-t border-brown pt-6 desktop:sticky desktop:top-24 desktop:border-t-0 desktop:pt-0">
            <h2 id="how-title" className="m-0 mb-0.5 text-h2 leading-[1.2] font-bold">
              Como funciona
            </h2>
            <OrderedSteps steps={HOW_IT_WORKS_STEPS} larger />
            <p className="m-0 text-small text-brown-400">{ADULT_NOTE}</p>
            <Actions className="hidden desktop:mt-3 desktop:flex desktop:flex-wrap desktop:items-center desktop:gap-x-6 desktop:gap-y-2" />
          </section>
        </div>
      </Container>

      <div className="sticky bottom-[calc(3.5rem+1.5px+max(1rem,env(safe-area-inset-bottom)))] z-20 border-t border-line bg-cream desktop:hidden">
        <Actions className="mx-auto flex max-w-xl flex-wrap items-center justify-between gap-x-3 gap-y-1 py-2.5 pr-5.5 pl-4" />
      </div>
    </>
  )
}
