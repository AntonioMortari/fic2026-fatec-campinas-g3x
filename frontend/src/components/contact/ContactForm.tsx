import { useState, type FormEvent } from 'react'
import { maskPhone } from '../../lib/format-phone'
import { useSendContact } from '../../services/contacts'
import { useFormFeedback } from '../auth/use-form-feedback'
import { Alert, Button, Checkbox, TextAreaField, TextField } from '../ui'

interface Values {
  name: string
  email: string
  phone: string
  institution: string
  message: string
  consent: boolean
}

const EMPTY: Values = { name: '', email: '', phone: '', institution: '', message: '', consent: false }

const FIELD_SUMMARIES: Record<string, string> = {
  name: 'Confira o nome marcado abaixo.',
  email: 'Confira o e-mail marcado abaixo.',
  phone: 'Confira o telefone marcado abaixo.',
  institution: 'Confira a instituição marcada abaixo.',
  message: 'Confira a mensagem marcada abaixo.',
  consent: 'Confira a concordância marcada abaixo.',
}

export function ContactForm({ onSent }: { onSent: () => void }) {
  const [values, setValues] = useState<Values>(EMPTY)
  const send = useSendContact()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const invalid = Object.keys(feedback.fields)

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    send.mutate(values, { onSuccess: onSent, onError: feedback.fail })
  }

  const summary =
    invalid.length === 1 ? (FIELD_SUMMARIES[invalid[0]!] ?? 'Confira o campo marcado abaixo.') : invalid.length > 1 ? 'Confira os campos marcados abaixo.' : feedback.error?.message

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 desktop:gap-4.5 desktop:[&_div.bg-card]:bg-cream">
      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {summary}
        </Alert>
      )}
      <div className="flex flex-col gap-4 desktop:grid desktop:grid-cols-2 desktop:gap-4">
        <TextField label="Seu nome" name="name" autoComplete="name" required maxLength={120} value={values.name} onChange={(e) => set('name', e.target.value)} error={feedback.fields.name} />
        <TextField
          label="E-mail"
          type="email"
          name="email"
          autoComplete="email"
          inputMode="email"
          autoCapitalize="none"
          required
          hint="É por aqui que respondemos."
          maxLength={254}
          value={values.email}
          onChange={(e) => set('email', e.target.value)}
          error={feedback.fields.email}
        />
        <TextField
          label="Telefone"
          labelNote="opcional"
          type="tel"
          name="phone"
          autoComplete="tel"
          inputMode="tel"
          hint="Com DDD, como (11) 95396-8344."
          maxLength={15}
          value={values.phone}
          onChange={(e) => set('phone', maskPhone(e.target.value))}
          error={feedback.fields.phone}
        />
        <TextField
          label="Instituição"
          labelNote="opcional"
          name="institution"
          autoComplete="organization"
          hint="Escola, empresa, coletivo, imprensa."
          maxLength={160}
          value={values.institution}
          onChange={(e) => set('institution', e.target.value)}
          error={feedback.fields.institution}
        />
      </div>
      <TextAreaField
        label="Mensagem"
        name="message"
        required
        rows={3}
        className="[&_textarea]:min-h-29.5 desktop:[&_textarea]:min-h-37"
        hint="Conte o que você precisa. Não tem forma certa."
        maxLength={5000}
        value={values.message}
        onChange={(e) => set('message', e.target.value)}
        error={feedback.fields.message}
      />
      <p className="m-0 text-[0.84375rem] leading-normal text-brown-600 desktop:text-small">
        Usamos o que você escrever aqui só para responder você. O que guardamos, por quanto tempo, e como pedir a exclusão está na política de privacidade.
      </p>
      <Checkbox
        label={<span className="block text-[0.9375rem] leading-[1.45]">Concordo que o Ateliê use estes dados para responder minha mensagem.</span>}
        className="-my-2"
        name="consent"
        checked={values.consent}
        onChange={(e) => set('consent', e.target.checked)}
        error={feedback.fields.consent}
      />
      <Button type="submit" variant="applique" loading={send.isPending} className="min-h-13 w-full desktop:w-auto desktop:self-start desktop:px-7">
        Enviar mensagem
      </Button>
    </form>
  )
}
