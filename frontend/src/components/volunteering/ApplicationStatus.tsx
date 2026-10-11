import { useEffect, useRef } from 'react'
import { cn } from '../../lib/cn'
import { CONTACTS } from '../../lib/contacts'
import { PERSON_STATUS_LABELS, WHAT_HAPPENS_NEXT_STEPS, sentOn, timelineDone } from '../../lib/volunteering'
import type { MyVolunteerApplication, VolunteerStatus } from '../../types/volunteering'
import { Button, Card } from '../ui'

const BADGE: Record<VolunteerStatus, string> = {
  new: 'Enviada',
  in_contact: 'Em contato',
  volunteering: 'Voluntariando',
  ended: 'Encerrada',
}

function Timeline({ status }: { status: VolunteerStatus }) {
  const done = timelineDone(status)
  return (
    <ol aria-label="Etapas depois da candidatura" className="m-0 list-none border-b border-line p-0">
      {WHAT_HAPPENS_NEXT_STEPS.map((step, index) => {
        const finished = index < done
        return (
          <li key={step} className="flex items-start gap-3.5 border-t border-line py-3">
            <span
              aria-hidden="true"
              className={cn('grid size-5.5 shrink-0 place-items-center border text-xs font-bold', finished ? 'border-ochre bg-ochre' : 'border-brown bg-transparent')}
            >
              {finished ? '✓' : index + 1}
            </span>
            <span className={cn('text-[0.9375rem] leading-[1.5]', finished ? 'font-semibold' : 'font-normal')}>
              {step}
              {finished && <span className="sr-only"> (já aconteceu)</span>}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export function ApplicationStatus({ application, focusTitle = false }: { application: MyVolunteerApplication; focusTitle?: boolean }) {
  const title = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (focusTitle) title.current?.focus()
  }, [focusTitle])

  return (
    <div className="flex max-w-xl flex-col gap-4 pb-10">
      <header className="flex flex-col items-start gap-5 pt-4 desktop:pt-12">
        <p className="m-0 bg-brown px-2.5 py-1 text-overline leading-[1.2] font-bold tracking-[0.1em] text-cream uppercase">{BADGE[application.status]}</p>
        <h1 ref={title} tabIndex={-1} className="m-0 text-[1.875rem] leading-[1.1] font-bold outline-none text-pretty desktop:text-h1-desktop">
          Você já se candidatou
        </h1>
      </header>

      <Card elevation="flat" className="flex flex-col gap-3 p-4">
        <p className="m-0 text-[1rem] leading-[1.45] font-bold">
          {PERSON_STATUS_LABELS[application.status]} — enviada em {sentOn(application.createdAt)}.
        </p>
        <ul aria-label="Áreas escolhidas" className="m-0 flex list-none flex-wrap gap-x-2 gap-y-1.5 p-0">
          {application.areas.map((area) => (
            <li key={area.id} className="rounded-full border border-brown px-2.5 py-1 text-[0.8125rem] leading-[1.2] font-semibold">
              {area.name}
            </li>
          ))}
        </ul>
      </Card>

      <Timeline status={application.status} />

      <p className="m-0 mt-1 text-[0.9375rem] leading-[1.55] text-brown-600">
        Não precisa mandar de novo. Se quiser mudar as áreas ou desistir, chame no WhatsApp{' '}
        <a href={CONTACTS.whatsapp} className="font-bold text-brown">
          {CONTACTS.phoneDisplay}
        </a>
        : a candidatura só a equipe do Ateliê consegue alterar.
      </p>

      <Button to="/minha-conta/candidaturas" variant="secondary" className="mt-1 min-h-13 w-full desktop:w-auto desktop:self-start desktop:px-8">
        Ver na minha conta
      </Button>
    </div>
  )
}
