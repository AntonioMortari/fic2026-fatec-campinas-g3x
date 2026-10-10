import { useState, type FormEvent, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { parseApiError } from '../../lib/api-error'
import { cn } from '../../lib/cn'
import { toLocalInput } from '../../lib/dates'
import type { AdminEvent, EventInput } from '../../types/admin-event'
import { useFormFeedback } from '../auth/use-form-feedback'
import { Alert, Button, Checkbox, Chevron, TextAreaField, TextField } from '../ui'
import { AdminPage } from './AdminPage'

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
    capacity: capacity === '' ? null : Number.isFinite(number) ? number : capacity,
    requiresCpf: values.requiresCpf,
  }
}

// The form is one column of numbered sections on the desktop (design 9c) and one section per screen on the phone (10d).
const SECTIONS = [
  { title: 'O que é', next: 'Quando e onde', fields: ['title', 'category', 'description'] },
  { title: 'Quando e onde', next: 'Inscrições', fields: ['startsAt', 'endsAt', 'location'] },
  { title: 'Inscrições', next: '', fields: ['ageRange', 'capacity', 'requiresCpf'] },
] as const

function stepOfField(field: string): number {
  const index = SECTIONS.findIndex((section) => (section.fields as readonly string[]).includes(field))
  return index === -1 ? 0 : index
}

interface EventFormProps {
  event?: AdminEvent
  saving: boolean
  onSubmit: (input: EventInput, onError: (error: unknown) => void) => void
  header: ReactNode
}

export function EventForm({ event, saving, onSubmit, header }: EventFormProps) {
  const [values, setValues] = useState<Values>(() => (event ? fromEvent(event) : EMPTY))
  const [step, setStep] = useState(0)
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0
  const last = step === SECTIONS.length - 1

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    feedback.clear()
    onSubmit(toInput(values), (error) => {
      const fields = Object.keys(parseApiError(error).fields)
      if (fields.length > 0) setStep(Math.min(...fields.map(stepOfField)))
      feedback.fail(error)
    })
  }

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
            <span key={section.title} className={cn('h-1', index <= step ? 'bg-ochre' : 'bg-cream-dark')} />
          ))}
        </div>
      </div>

      <AdminPage className="flex flex-1 flex-col gap-6 desktop:max-w-[calc(45rem+6rem)] desktop:gap-7">
        {header}

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
          <TextField
            label="Limite de vagas"
            name="capacity"
            inputMode="numeric"
            hint="Opcional. Em branco, a atividade não tem limite."
            value={values.capacity}
            onChange={(e) => set('capacity', e.target.value)}
            error={feedback.fields.capacity}
          />
          <Checkbox
            label="Pedir CPF na inscrição"
            name="requiresCpf"
            hint="Marque só se a atividade exige documento."
            checked={values.requiresCpf}
            onChange={(e) => set('requiresCpf', e.target.checked)}
            error={feedback.fields.requiresCpf}
          />
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
          onClick={() => setStep(step - 1)}
          className={cn('min-h-12 cursor-pointer bg-transparent px-1 text-[0.9375rem] font-semibold text-blue-deep hover:text-brown desktop:hidden', step === 0 && 'hidden')}
        >
          Anterior
        </button>
        {!last && (
          <Button type="button" variant="applique" className="min-h-13 flex-1 desktop:hidden" onClick={() => setStep(step + 1)}>
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
    <section aria-labelledby={`section-${index}`} className={cn('flex-col gap-4 desktop:flex desktop:gap-4.5', index === step ? 'flex' : 'hidden')}>
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
