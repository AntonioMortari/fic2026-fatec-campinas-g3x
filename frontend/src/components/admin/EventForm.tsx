import { useState, type FormEvent } from 'react'
import { toLocalInput } from '../../lib/dates'
import type { AdminEvent, EventInput } from '../../types/admin-event'
import { useFormFeedback } from '../auth/use-form-feedback'
import { ActionBar, Alert, Button, Checkbox, TextAreaField, TextField } from '../ui'

interface Values {
  title: string
  category: string
  startsAt: string
  endsAt: string
  location: string
  ageRange: string
  capacity: string
  requiresCpf: boolean
  description: string
}

const EMPTY: Values = {
  title: '',
  category: '',
  startsAt: '',
  endsAt: '',
  location: '',
  ageRange: '',
  capacity: '',
  requiresCpf: false,
  description: '',
}

function fromEvent(event: AdminEvent): Values {
  return {
    title: event.title,
    category: event.category ?? '',
    startsAt: toLocalInput(event.startsAt),
    endsAt: event.endsAt ? toLocalInput(event.endsAt) : '',
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
    startsAt: values.startsAt,
    endsAt: values.endsAt || null,
    location: values.location,
    ageRange: values.ageRange,
    // Text that is not a number goes as text so the server refuses it; NaN would be sent as null, meaning "no limit".
    capacity: capacity === '' ? null : Number.isFinite(number) ? number : capacity,
    requiresCpf: values.requiresCpf,
  }
}

interface EventFormProps {
  event?: AdminEvent
  saving: boolean
  onSubmit: (input: EventInput, onError: (error: unknown) => void) => void
}

export function EventForm({ event, saving, onSubmit }: EventFormProps) {
  const [values, setValues] = useState<Values>(() => (event ? fromEvent(event) : EMPTY))
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    feedback.clear()
    onSubmit(toInput(values), feedback.fail)
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex max-w-xl flex-col gap-4">
      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
        </Alert>
      )}
      <TextField
        label="Título"
        name="title"
        required
        value={values.title}
        onChange={(e) => set('title', e.target.value)}
        error={feedback.fields.title}
      />
      <TextField
        label="Tipo"
        name="category"
        hint="Como aparece no filtro da agenda, por exemplo Contação, Oficina ou Apresentação. Escreva sempre do mesmo jeito."
        value={values.category}
        onChange={(e) => set('category', e.target.value)}
        error={feedback.fields.category}
      />
      <TextField
        label="Começa em"
        type="datetime-local"
        name="startsAt"
        required
        hint="Horário de São Paulo."
        value={values.startsAt}
        onChange={(e) => set('startsAt', e.target.value)}
        error={feedback.fields.startsAt}
      />
      <TextField
        label="Termina em"
        type="datetime-local"
        name="endsAt"
        hint="Opcional."
        value={values.endsAt}
        onChange={(e) => set('endsAt', e.target.value)}
        error={feedback.fields.endsAt}
      />
      <TextField
        label="Local"
        name="location"
        value={values.location}
        onChange={(e) => set('location', e.target.value)}
        error={feedback.fields.location}
      />
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
      <TextAreaField
        label="Descrição"
        name="description"
        hint="Opcional."
        value={values.description}
        onChange={(e) => set('description', e.target.value)}
        error={feedback.fields.description}
      />
      <ActionBar
        primary={
          <Button type="submit" variant="applique" loading={saving} className="min-h-13 w-full desktop:w-auto desktop:px-8">
            Salvar
          </Button>
        }
        secondary={
          <Button to="/admin/eventos" variant="secondary" className="min-h-13">
            Cancelar
          </Button>
        }
      />
      <p className="m-0 text-small text-brown-400">Salvar não publica o evento: quem publica é o botão da lista.</p>
    </form>
  )
}
