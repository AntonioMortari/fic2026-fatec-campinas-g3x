import { useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { parseApiError, type ParsedApiError } from '../../lib/api-error'
import { cn } from '../../lib/cn'
import { toLocalInput } from '../../lib/dates'
import type { AdminEvent, EventInput } from '../../types/admin-event'
import { scrollToStart } from '../../lib/motion'
import { useFormFeedback } from '../auth/use-form-feedback'
import { Alert, Button, Checkbox, Chevron, SegmentedField, TextAreaField, TextField } from '../ui'
import { AdminPage } from './AdminPage'
import { EMPTY_PHOTO, type PhotoDraft } from '../../lib/photo-file'
import { EventPhotoField } from './EventPhotoField'

export type PhotoChange = { kind: 'upload'; blob: Blob; alt: string } | { kind: 'remove' } | null

export interface SubmitHandlers {
  onError: (error: unknown) => void
  onPhotoError: (error: unknown) => void
}

const SIGN_UP_OPTIONS = [
  { value: 'site', label: 'Pelo site' },
  { value: 'none', label: 'Sem inscrição pelo site' },
] as const
const SIGN_UP_HELP = {
  site: 'Quem visita se inscreve pelo formulário do evento, sem criar conta.',
  none: 'A página do evento diz "Não precisa se inscrever". Use para apresentação aberta ou evento em outro espaço que cuida da própria entrada.',
}

interface Values {
  title: string
  category: string
  date: string
  startTime: string
  endTime: string
  location: string
  ageRange: string
  capacity: string
  requiresCpf: boolean
  onSite: boolean
  description: string
}

const EMPTY: Values = {
  title: '',
  category: '',
  date: '',
  startTime: '',
  endTime: '',
  location: '',
  ageRange: '',
  capacity: '',
  requiresCpf: false,
  onSite: true,
  description: '',
}

function fromEvent(event: AdminEvent): Values {
  const [date = '', startTime = ''] = toLocalInput(event.startsAt).split('T')
  return {
    title: event.title,
    category: event.category ?? '',
    date,
    startTime,
    endTime: event.endsAt ? (toLocalInput(event.endsAt).split('T')[1] ?? '') : '',
    location: event.location ?? '',
    ageRange: event.ageRange ?? '',
    capacity: event.capacity === null ? '' : String(event.capacity),
    requiresCpf: event.requiresCpf,
    onSite: event.registrationOnSite,
    description: event.description ?? '',
  }
}

function toInput(values: Values): EventInput {
  const capacity = values.capacity.trim()
  const number = Number(capacity)
  return {
    title: values.title,
    description: values.description,
    category: values.category,
    startsAt: values.date && values.startTime ? `${values.date}T${values.startTime}` : values.date,
    endsAt: values.date && values.endTime ? `${values.date}T${values.endTime}` : null,
    location: values.location,
    ageRange: values.ageRange,
    // Text that is not a number goes as text so the server refuses it; NaN would be sent as null, meaning "no limit".
    capacity: !values.onSite || capacity === '' ? null : Number.isFinite(number) ? number : capacity,
    requiresCpf: values.onSite && values.requiresCpf,
    registrationOnSite: values.onSite,
  }
}

// The form is one column of numbered sections on the desktop (design 9c) and one section per screen on the phone (10d).
const SECTIONS = [
  { title: 'O que é', next: 'Quando e onde', fields: ['title', 'category', 'description', 'data', 'alt', 'authorized'] },
  { title: 'Quando e onde', next: 'Inscrições', fields: ['startsAt', 'endsAt', 'location'] },
  { title: 'Inscrições', next: '', fields: ['ageRange', 'registrationOnSite', 'capacity', 'requiresCpf'] },
] as const

function stepOfField(field: string): number {
  const index = SECTIONS.findIndex((section) => (section.fields as readonly string[]).includes(field))
  return index === -1 ? 0 : index
}

interface EventFormProps {
  event?: AdminEvent
  saving: boolean
  onSubmit: (input: EventInput, photo: PhotoChange, handlers: SubmitHandlers) => void
  header: ReactNode
  photoNotice?: string
  initialPhotoAlt?: string
}

export function EventForm({ event, saving, onSubmit, header, photoNotice, initialPhotoAlt = '' }: EventFormProps) {
  const [values, setValues] = useState<Values>(() => (event ? fromEvent(event) : EMPTY))
  const [step, setStep] = useState(0)
  const [photo, setPhoto] = useState<PhotoDraft>({ ...EMPTY_PHOTO, alt: initialPhotoAlt })
  const [photoErrors, setPhotoErrors] = useState<{ alt?: string; authorized?: string }>({})
  const [photoFailure, setPhotoFailure] = useState<ParsedApiError | null>(null)
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0
  const last = step === SECTIONS.length - 1

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function updatePhoto(next: PhotoDraft) {
    setPhoto(next)
    setPhotoErrors({})
  }

  useEffect(() => {
    if (Object.keys(photoErrors).length > 0) formRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus()
  }, [photoErrors, formRef])

  function goToStep(next: number) {
    setStep(next)
    scrollToStart()
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    feedback.clear()
    setPhotoFailure(null)

    if (photo.blob) {
      const errors = {
        ...(photo.alt.trim() ? {} : { alt: 'Descreva a foto para quem não a enxerga.' }),
        ...(photo.authorized ? {} : { authorized: 'Para subir a foto, confirme que existe autorização de uso de imagem.' }),
      }
      if (Object.keys(errors).length > 0) {
        setStep(0)
        setPhotoErrors(errors)
        return
      }
    }

    const change: PhotoChange = photo.blob ? { kind: 'upload', blob: photo.blob, alt: photo.alt.trim() } : photo.removed ? { kind: 'remove' } : null
    onSubmit(toInput(values), change, {
      onError: (error) => {
        const fields = Object.keys(parseApiError(error).fields)
        if (fields.length > 0) setStep(Math.min(...fields.map(stepOfField)))
        feedback.fail(error)
      },
      onPhotoError: (error) => {
        setStep(0)
        setPhotoFailure(parseApiError(error))
      },
    })
  }

  const photoFields: Record<string, string | undefined> = { ...photoErrors, ...(photoFailure?.fields ?? {}) }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex min-h-dvh flex-col desktop:min-h-[calc(100dvh-4.5rem)]">
      <div className="sticky top-0 z-20 border-b border-line bg-cream desktop:hidden">
        <div className="flex h-15 items-center px-1">
          <Link to="/admin/eventos" className="flex min-h-11 items-center gap-2 px-3 text-[0.9375rem] font-semibold text-brown no-underline hover:text-blue-deep">
            <Chevron direction="left" />
            <span>
              <span className="sr-only">Voltar para</span> Eventos
            </span>
          </Link>
        </div>
        <div aria-hidden="true" className="grid gap-1.5 px-4 pb-0" style={{ gridTemplateColumns: `repeat(${SECTIONS.length}, minmax(0, 1fr))` }}>
          {SECTIONS.map((section, index) => (
            <span key={section.title} className={cn('h-1 transition-colors duration-(--motion-change)', index <= step ? 'bg-ochre' : 'bg-cream-dark')} />
          ))}
        </div>
      </div>

      <AdminPage className="flex flex-1 flex-col gap-6 desktop:max-w-[calc(45rem+6rem)] desktop:gap-7">
        {header}

        {(photoNotice || photoFailure) && (
          <Alert tone="error">
            O evento foi salvo, mas a foto não subiu: {photoFailure?.message ?? photoNotice} Escolha a foto e salve de novo.
          </Alert>
        )}

        {feedback.error && (
          <Alert ref={alertRef} tone="error">
            {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
          </Alert>
        )}

        <Section index={0} step={step} title={SECTIONS[0].title}>
          <TextField label="Título" name="title" required value={values.title} onChange={(e) => set('title', e.target.value)} error={feedback.fields.title} />
          <TextField
            label="Tipo"
            name="category"
            hint="Como aparece no filtro da agenda, por exemplo Contação, Oficina ou Apresentação. Escreva sempre do mesmo jeito."
            value={values.category}
            onChange={(e) => set('category', e.target.value)}
            error={feedback.fields.category}
          />
          <TextAreaField
            label="Descrição"
            name="description"
            hint="Opcional."
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            error={feedback.fields.description}
          />
          <EventPhotoField event={event} draft={photo} onChange={updatePhoto} errors={{ data: feedback.fields.data ?? photoFields.data, alt: photoFields.alt ?? feedback.fields.alt, authorized: photoFields.authorized ?? feedback.fields.authorized }} />
        </Section>

        <Section index={1} step={step} title={SECTIONS[1].title}>
          <TextField label="Dia" type="date" name="date" required value={values.date} onChange={(e) => set('date', e.target.value)} error={feedback.fields.startsAt} />
          <div className="grid grid-cols-2 gap-3.5 desktop:gap-4">
            <TextField
              label="Início"
              type="time"
              name="startTime"
              required
              hint="Horário de São Paulo."
              value={values.startTime}
              onChange={(e) => set('startTime', e.target.value)}
            />
            <TextField
              label="Fim"
              type="time"
              name="endTime"
              hint="Opcional."
              value={values.endTime}
              onChange={(e) => set('endTime', e.target.value)}
              error={feedback.fields.endsAt}
            />
          </div>
          <TextField label="Local" name="location" value={values.location} onChange={(e) => set('location', e.target.value)} error={feedback.fields.location} />
        </Section>

        <Section index={2} step={step} title={SECTIONS[2].title}>
          <TextField
            label="Faixa etária"
            name="ageRange"
            hint="Por exemplo: Livre, ou A partir de 10 anos."
            value={values.ageRange}
            onChange={(e) => set('ageRange', e.target.value)}
            error={feedback.fields.ageRange}
          />
          <SegmentedField
            legend="Inscrição"
            name="registrationOnSite"
            options={[...SIGN_UP_OPTIONS]}
            value={values.onSite ? 'site' : 'none'}
            onChange={(next) => set('onSite', next === 'site')}
            error={feedback.fields.registrationOnSite}
          />
          <p className="m-0 -mt-2 text-[0.84375rem] leading-[1.45] text-brown-600">{SIGN_UP_HELP[values.onSite ? 'site' : 'none']}</p>
          {values.onSite && (
            <div className="grid grid-cols-1 gap-3.5 desktop:grid-cols-2 desktop:gap-4">
              <TextField
                label="Vagas"
                name="capacity"
                inputMode="numeric"
                hint="Em branco = sem limite."
                value={values.capacity}
                onChange={(e) => set('capacity', e.target.value)}
                error={feedback.fields.capacity}
              />
              <fieldset className="m-0 flex flex-col gap-1.5 border-0 p-0">
                <legend className="mb-1.5 p-0 text-[0.9375rem] font-semibold">CPF</legend>
                <Checkbox
                  label="Este evento exige CPF"
                  name="requiresCpf"
                  hint="Só quando a instituição parceira pede (RN06)."
                  checked={values.requiresCpf}
                  onChange={(e) => set('requiresCpf', e.target.checked)}
                  error={feedback.fields.requiresCpf}
                />
              </fieldset>
            </div>
          )}
        </Section>

        <p className="m-0 text-small text-brown-400">Salvar não publica o evento: quem publica é o botão da lista.</p>
      </AdminPage>

      <div className="fixed inset-x-0 bottom-0 z-30 flex items-center gap-3 border-t border-line bg-cream px-4 pt-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] print:hidden desktop:sticky desktop:mt-auto desktop:justify-end desktop:px-12 desktop:py-4">
        <Button
          to="/admin/eventos"
          variant="secondary"
          className="min-h-12 text-[0.9375rem] max-desktop:hidden"
        >
          Cancelar
        </Button>
        <button
          type="button"
          onClick={() => goToStep(step - 1)}
          className={cn('min-h-12 cursor-pointer bg-transparent px-1 text-[0.9375rem] font-semibold text-blue-deep hover:text-brown desktop:hidden', step === 0 && 'hidden')}
        >
          Anterior
        </button>
        {!last && (
          <Button type="button" variant="applique" className="min-h-13 flex-1 desktop:hidden" onClick={() => goToStep(step + 1)}>
            Próximo: {SECTIONS[step]?.next}
          </Button>
        )}
        <Button type="submit" variant="applique" loading={saving} className={cn('min-h-12 text-[0.9375rem] desktop:inline-flex desktop:px-8', last ? 'min-h-13 flex-1 desktop:flex-none' : 'max-desktop:hidden')}>
          Salvar
        </Button>
      </div>
    </form>
  )
}

function Section({ index, step, title, children }: { index: number; step: number; title: string; children: ReactNode }) {
  return (
    <section aria-labelledby={`section-${index}`} className={cn('flex-col gap-4 desktop:flex desktop:gap-4.5', index === step ? 'flex max-desktop:animate-rise' : 'hidden')}>
      <div className="flex flex-col gap-1 desktop:border-b desktop:border-brown desktop:pb-2">
        <p className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep desktop:hidden">
          Passo {index + 1} de {SECTIONS.length}
        </p>
        <h2 id={`section-${index}`} className="m-0 text-[1.625rem] leading-[1.2] font-bold desktop:text-[1.1875rem]">
          <span aria-hidden="true" className="mr-2.5 hidden text-ochre-deep desktop:inline">
            {index + 1}
          </span>
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}
