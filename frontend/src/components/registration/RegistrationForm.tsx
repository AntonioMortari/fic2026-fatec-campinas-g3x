import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { formatPhone } from '../../lib/format-phone'
import { useEventRegistration } from '../../services/events'
import type { AuthUser } from '../../services/auth'
import type { EventDetail } from '../../types/event'
import { useFormFeedback } from '../auth/use-form-feedback'
import { ActionBar, Alert, Button, Checkbox, TextField } from '../ui'

interface Values {
  name: string
  email: string
  phone: string
  cpf: string
  isMinor: boolean
  guardianName: string
  guardianPhone: string
  imageAuthorized: boolean
  consent: boolean
}

function initialValues(account: AuthUser | null): Values {
  return {
    name: account?.name ?? '',
    email: account?.email ?? '',
    phone: account?.phone ? formatPhone(account.phone) : '',
    cpf: '',
    isMinor: false,
    guardianName: '',
    guardianPhone: '',
    imageAuthorized: false,
    consent: false,
  }
}

interface RegistrationFormProps {
  event: EventDetail
  account: AuthUser | null
  onDone: (done: { name: string; cancelCode: string }) => void
}

export function RegistrationForm({ event, account, onDone }: RegistrationFormProps) {
  const [values, setValues] = useState(() => initialValues(account))
  const registration = useEventRegistration(event.id)
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(submitEvent: FormEvent) {
    submitEvent.preventDefault()
    feedback.clear()
    registration.mutate(values, { onSuccess: (result) => onDone({ name: result.registration.name, cancelCode: result.registration.cancelCode }), onError: feedback.fail })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {account ? (
        <Alert tone="info">
          Você entrou como <strong>{account.name}</strong>. Seus dados já estão preenchidos; para inscrever outra pessoa, troque o nome.
        </Alert>
      ) : (
        <p className="m-0 flex flex-wrap items-center gap-x-1.5 text-small text-brown-400">
          Já tem conta?
          <Link to={`/entrar?voltar=${encodeURIComponent(`/agenda/${event.id}/inscricao`)}`} className="inline-flex min-h-11 items-center font-semibold">
            Entre
          </Link>
          para trazer seus dados preenchidos.
        </p>
      )}

      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
        </Alert>
      )}

      <TextField
        label="Nome de quem vai participar"
        name="name"
        autoComplete="name"
        required
        value={values.name}
        onChange={(e) => set('name', e.target.value)}
        error={feedback.fields.name}
      />
      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        required
        hint="Para a equipe falar com você sobre a atividade."
        value={values.email}
        onChange={(e) => set('email', e.target.value)}
        error={feedback.fields.email}
      />
      <TextField
        label="Telefone (opcional)"
        type="tel"
        name="phone"
        autoComplete="tel"
        inputMode="tel"
        hint="Com DDD, como (11) 95396-8344."
        value={values.phone}
        onChange={(e) => set('phone', e.target.value)}
        error={feedback.fields.phone}
      />
      {event.requiresCpf && (
        <TextField
          label="CPF de quem vai participar"
          name="cpf"
          inputMode="numeric"
          autoComplete="off"
          required
          hint="Esta atividade pede o documento. Só números."
          value={values.cpf}
          onChange={(e) => set('cpf', e.target.value)}
          error={feedback.fields.cpf}
        />
      )}

      <div className="border-[1.5px] border-brown bg-card px-3.5">
        <Checkbox
          label="Quem vai participar tem menos de 18 anos"
          name="isMinor"
          checked={values.isMinor}
          onChange={(e) => set('isMinor', e.target.checked)}
        />
      </div>
      {values.isMinor && (
        <div className="flex flex-col gap-4 border-l-[3px] border-line-strong pl-4">
          <TextField
            label="Nome do responsável"
            name="guardianName"
            autoComplete="off"
            required
            value={values.guardianName}
            onChange={(e) => set('guardianName', e.target.value)}
            error={feedback.fields.guardianName}
          />
          <TextField
            label="Telefone do responsável"
            type="tel"
            name="guardianPhone"
            inputMode="tel"
            autoComplete="off"
            required
            hint="É por ele que falamos com a família no dia."
            value={values.guardianPhone}
            onChange={(e) => set('guardianPhone', e.target.value)}
            error={feedback.fields.guardianPhone}
          />
        </div>
      )}

      <Checkbox
        label={values.isMinor ? 'Autorizo o uso de fotos e vídeos em que quem vai participar apareça.' : 'Autorizo o uso de fotos e vídeos em que eu apareça.'}
        name="imageAuthorized"
        hint="Opcional — dá para participar sem autorizar."
        checked={values.imageAuthorized}
        onChange={(e) => set('imageAuthorized', e.target.checked)}
      />
      <Checkbox
        label="Concordo que o Ateliê use estes dados para organizar esta atividade."
        name="consent"
        checked={values.consent}
        onChange={(e) => set('consent', e.target.checked)}
        error={feedback.fields.consent}
      />

      <ActionBar
        primary={
          <Button type="submit" variant="applique" loading={registration.isPending} className="min-h-13 w-full desktop:w-auto desktop:px-8">
            Confirmar inscrição
          </Button>
        }
      />
    </form>
  )
}
