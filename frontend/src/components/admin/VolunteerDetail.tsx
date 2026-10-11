import { parseApiError } from '../../lib/api-error'
import { cn } from '../../lib/cn'
import { formatPhone } from '../../lib/format-phone'
import { NEXT_STEP, STAFF_STATUS_LABELS, detailDate } from '../../lib/volunteering'
import { useSetVolunteerStatus } from '../../services/admin-volunteers'
import type { AdminVolunteerApplication, VolunteerStatus } from '../../types/volunteering'
import { Button, useToast } from '../ui'
import { VolunteerStatusPicker } from './VolunteerStatusPicker'

const CONTACT_LINK = 'inline-flex min-h-11 items-center break-all font-semibold underline text-blue-deep desktop:min-h-0 desktop:text-brown'

function ContactRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line px-3.5 py-1 last:border-b-0 desktop:flex-row desktop:items-baseline desktop:gap-0 desktop:border-0 desktop:px-0 desktop:py-1.5">
      <dt className="text-xs font-semibold text-brown-400 desktop:w-25.5 desktop:text-[0.9375rem] desktop:leading-[1.2] desktop:font-normal">{label}</dt>
      <dd className="m-0 text-[0.96875rem] desktop:text-[0.9375rem] desktop:leading-[1.2]">{children}</dd>
    </div>
  )
}

export function VolunteerDetail({ application }: { application: AdminVolunteerApplication }) {
  const toast = useToast()
  const setStatus = useSetVolunteerStatus()
  const next = NEXT_STEP[application.status]

  function apply(target: VolunteerStatus, origin: VolunteerStatus, offerUndo: boolean) {
    setStatus.mutate(
      { id: application.id, status: target },
      {
        onSuccess: () =>
          toast(`${application.name}: ${STAFF_STATUS_LABELS[target].toLowerCase()}.`, {
            action: offerUndo ? { label: 'Desfazer', onClick: () => apply(origin, target, false) } : undefined,
          }),
        onError: (error) => toast(parseApiError(error).message, { tone: 'error' }),
      },
    )
  }

  function change(status: VolunteerStatus) {
    apply(status, application.status, true)
  }

  const busy = setStatus.isPending
  const whatsapp = application.phone ? `https://wa.me/55${application.phone}` : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pt-5 pb-28 desktop:px-8 desktop:pt-9 desktop:pb-6">
        <header className="flex flex-col gap-1">
          <p className="m-0 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-ochre-deep">
            <span className="hidden desktop:inline">Candidatou-se em </span>
            <time dateTime={application.createdAt}>{detailDate(application.createdAt)}</time>
          </p>
          <h2 className="m-0 text-[1.75rem] leading-[1.2] font-bold text-pretty desktop:text-[1.625rem]">{application.name}</h2>
        </header>

        <dl className="m-0 flex flex-col border border-line bg-card max-desktop:mt-2.5 desktop:border-0 desktop:bg-transparent">
          <ContactRow label="E-mail">
            <a className={CONTACT_LINK} href={`mailto:${application.email}`}>
              {application.email}
            </a>
          </ContactRow>
          <ContactRow label="Telefone">
            {application.phone ? (
              <a className={CONTACT_LINK} href={`tel:${application.phone}`}>
                {formatPhone(application.phone)}
              </a>
            ) : (
              <span className="text-brown-400">Não informado</span>
            )}
          </ContactRow>
        </dl>

        <section aria-labelledby={`areas-${application.id}`} className="flex flex-col gap-2">
          <h3 id={`areas-${application.id}`} className="m-0 hidden text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-brown-400 desktop:block">
            Áreas
          </h3>
          <ul aria-labelledby={`areas-${application.id}`} className="m-0 flex list-none flex-wrap gap-2 p-0">
            {application.areas.map((area) => (
              <li key={area.id} className="rounded-full border border-brown px-2.5 py-1 text-[0.8125rem] leading-[1.2] font-semibold">
                {area.name}
              </li>
            ))}
          </ul>
        </section>

        {application.message && (
          <blockquote className="m-0 border border-line bg-card px-4 py-5 text-[0.96875rem] leading-[1.3] break-words whitespace-pre-wrap">{application.message}</blockquote>
        )}

        <VolunteerStatusPicker name={`status-${application.id}`} value={application.status} busy={busy} onChange={change} />
      </div>

      <div
        className={cn(
          'safe-area-bottom fixed inset-x-0 bottom-0 z-30 flex gap-2.5 border-t border-line bg-cream px-4 pt-3',
          'desktop:static desktop:z-auto desktop:px-8 desktop:py-5',
        )}
      >
        {whatsapp && (
          <Button href={whatsapp} target="_blank" rel="noreferrer" variant="secondary" size="compact" className="min-h-13 min-w-0 flex-[3] px-2! text-[0.9375rem] desktop:text-small">
            <span className="desktop:hidden">WhatsApp</span>
            <span className="hidden desktop:inline">Chamar no WhatsApp</span>
            <span className="sr-only"> (abre em outra aba)</span>
          </Button>
        )}
        <Button variant="applique" loading={busy} onClick={() => change(next.to)} className="min-h-13 min-w-0 flex-[4] px-2! text-[0.9375rem] desktop:flex-[5]">
          {next.label}
        </Button>
      </div>
    </div>
  )
}
