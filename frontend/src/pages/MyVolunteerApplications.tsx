import { Link } from 'react-router-dom'
import { BackBar } from '../components/layout/BackBar'
import { Button, Container, EmptyState, LoadingState } from '../components/ui'
import { cn } from '../lib/cn'
import { APPLICATION_PATH, PERSON_STATUS_LABELS, findLive, isLive, joinAreas, listDate } from '../lib/volunteering'
import { useMyVolunteerApplications } from '../services/volunteering'
import type { MyVolunteerApplication } from '../types/volunteering'

function Row({ application }: { application: MyVolunteerApplication }) {
  const ended = !isLive(application.status)
  return (
    <li className="flex flex-col border-b border-line py-3.5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className={cn('m-0 text-[1rem] leading-[1.2] font-bold', ended && 'text-brown-400')}>{PERSON_STATUS_LABELS[application.status]}</h2>
        <time dateTime={application.createdAt} className={cn('shrink-0 text-[0.8125rem] leading-[1.2] font-bold', ended ? 'text-brown-400' : 'text-ochre-deep')}>
          {listDate(application.createdAt, ended)}
        </time>
      </div>
      <p className={cn('m-0 mt-1.5 text-small leading-[1.2]', ended ? 'text-brown-400' : 'text-brown-600')}>{joinAreas(application.areas)}</p>
    </li>
  )
}

export function MyVolunteerApplications() {
  const { data, isPending, isError, refetch } = useMyVolunteerApplications()
  const live = data ? findLive(data) : null

  return (
    <>
      <BackBar to="/minha-conta" label="Sua conta" />
      <Container className="pb-10">
        <div className="flex max-w-xl flex-col gap-5">
          <h1 className="m-0 pt-5.5 text-[1.75rem] leading-[1.15] font-bold text-pretty desktop:pt-4 desktop:text-h1-desktop">Minhas candidaturas ao voluntariado</h1>
          {isPending && <LoadingState label="Carregando suas candidaturas…" shape="cards" count={2} />}
          {isError && (
            <EmptyState
              tone="error"
              title="Não conseguimos carregar suas candidaturas"
              text="Tente de novo em alguns minutos."
              actions={
                <Button variant="secondary" size="compact" onClick={() => void refetch()}>
                  Tentar de novo
                </Button>
              }
            />
          )}
          {data?.length === 0 && (
            <EmptyState title="Você ainda não se candidatou" text="Escolha as áreas em que quer ajudar e conte um pouco de você." />
          )}
          {data && data.length > 0 && (
            <ul aria-label="Candidaturas" className="enter-list m-0 list-none border-t border-brown p-0">
              {data.map((application) => (
                <Row key={application.id} application={application} />
              ))}
            </ul>
          )}
          {data && !live && (
            <Button to={APPLICATION_PATH} variant="applique" className="w-full desktop:w-auto desktop:self-start desktop:px-8">
              Candidatar-se
            </Button>
          )}
          {live && (
            <p className="m-0 text-[0.9375rem] text-brown-600">
              As áreas em que o Ateliê precisa de gente estão na <Link to="/voluntariado">página de voluntariado</Link>.
            </p>
          )}
        </div>
      </Container>
    </>
  )
}
