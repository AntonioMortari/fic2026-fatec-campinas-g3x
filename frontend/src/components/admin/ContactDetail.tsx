import { useState } from 'react'
import { parseApiError } from '../../lib/api-error'
import { CONTACT_STATUS_LABELS, STAFF_NOTE_LIMIT, contactTitle, detailDate } from '../../lib/contacts-admin'
import { formatPhone } from '../../lib/format-phone'
import { useTriageContact } from '../../services/admin-contacts'
import type { AdminContact, ContactStatus } from '../../types/contacts'
import { TextAreaField, useToast } from '../ui'
import { ContactActionBar } from './ContactActionBar'
import { ContactStatusPicker } from './ContactStatusPicker'

const CONTACT_LINK = 'inline-flex min-h-11 items-center break-all font-semibold underline text-blue-deep desktop:min-h-0 desktop:text-brown'

function FichaRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-line px-3.5 py-1 last:border-b-0 desktop:flex-row desktop:items-baseline desktop:gap-0 desktop:border-0 desktop:px-0 desktop:py-1.5">
      <dt className="text-xs font-semibold text-brown-400 desktop:w-32 desktop:text-[0.9375rem] desktop:leading-[1.2] desktop:font-normal">{label}</dt>
      <dd className="m-0 text-[0.96875rem] desktop:text-[0.9375rem] desktop:leading-[1.2]">{children}</dd>
    </div>
  )
}

export function ContactDetail({ contact }: { contact: AdminContact }) {
  const toast = useToast()
  const statusChange = useTriageContact()
  const noteChange = useTriageContact()
  const [note, setNote] = useState(contact.staffNote ?? '')
  const [noteState, setNoteState] = useState<'idle' | 'saved' | 'failed'>('idle')
  const title = contactTitle(contact)

  function apply(target: ContactStatus, origin: ContactStatus, offerUndo: boolean) {
    statusChange.mutate(
      { id: contact.id, status: target },
      {
        onSuccess: () =>
          toast(`${title}: ${CONTACT_STATUS_LABELS[target].toLowerCase()}.`, {
            action: offerUndo ? { label: 'Desfazer', onClick: () => apply(origin, target, false) } : undefined,
          }),
        onError: (error) => toast(parseApiError(error).message, { tone: 'error' }),
      },
    )
  }

  function change(status: ContactStatus) {
    apply(status, contact.status, true)
  }

  function saveNote() {
    const next = note.trim()
    if (next === (contact.staffNote ?? '')) return
    setNoteState('idle')
    noteChange.mutate(
      { id: contact.id, staffNote: next },
      {
        onSuccess: () => setNoteState('saved'),
        onError: (error) => {
          setNoteState('failed')
          toast(parseApiError(error).message, { tone: 'error' })
        },
      },
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto px-4 pt-5 pb-28 desktop:px-8 desktop:pt-9 desktop:pb-6">
        <header className="flex flex-col gap-1">
          <p className="m-0 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-ochre-deep">
            Contato · <time dateTime={contact.createdAt}>{detailDate(contact.createdAt)}</time>
          </p>
          <h2 className="m-0 text-[1.75rem] leading-[1.2] font-bold text-pretty desktop:text-[1.625rem]">{title}</h2>
        </header>

        <dl className="m-0 flex flex-col border border-line bg-card max-desktop:mt-2.5 desktop:border-0 desktop:bg-transparent">
          {contact.institution && <FichaRow label="Quem escreveu">{contact.name}</FichaRow>}
          <FichaRow label="E-mail">
            <a className={CONTACT_LINK} href={`mailto:${contact.email}`}>
              {contact.email}
            </a>
          </FichaRow>
          <FichaRow label="Telefone">
            {contact.phone ? (
              <a className={CONTACT_LINK} href={`tel:${contact.phone}`}>
                {formatPhone(contact.phone)}
              </a>
            ) : (
              <span className="text-brown-400">Não informado</span>
            )}
          </FichaRow>
        </dl>

        <blockquote className="m-0 border border-line bg-card px-4 py-5 text-[0.96875rem] leading-[1.3] break-words whitespace-pre-wrap">{contact.message}</blockquote>

        <ContactStatusPicker name={`status-${contact.id}`} value={contact.status} busy={statusChange.isPending} onChange={change} />

        <div className="flex flex-col gap-1">
          <TextAreaField
            label={
              <>
                Nota interna <span className="font-normal text-brown-400">só a equipe vê</span>
              </>
            }
            rows={3}
            maxLength={STAFF_NOTE_LIMIT}
            placeholder="Ex.: liguei, volta a falar dia 15"
            value={note}
            onChange={(event) => {
              setNote(event.target.value)
              setNoteState('idle')
            }}
            onBlur={saveNote}
          />
          <p role="status" className="m-0 min-h-5 text-[0.8125rem] leading-[1.45] text-brown-400">
            {noteState === 'saved' && 'Nota guardada.'}
            {noteState === 'failed' && 'A nota não foi guardada. Toque fora do campo para tentar de novo.'}
          </p>
        </div>
      </div>

      <ContactActionBar contact={contact} busy={statusChange.isPending} onAdvance={change} />
    </div>
  )
}
