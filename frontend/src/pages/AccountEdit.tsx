import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useFormFeedback } from '../components/auth/use-form-feedback'
import { ActionBar, Alert, Button, SegmentedField, TextField } from '../components/ui'
import { useAuth } from '../contexts/useAuth'
import { CONTACTS } from '../lib/contacts'
import { formatPhone } from '../lib/format-phone'
import { PERSON_TYPE_SHORT_LABELS } from '../lib/person-type'
import { useUpdateProfile, type AuthUser, type PersonType } from '../services/auth'

const OPTIONS = (Object.keys(PERSON_TYPE_SHORT_LABELS) as PersonType[]).map((value) => ({ value, label: PERSON_TYPE_SHORT_LABELS[value] }))
const FIELD_NAMES: Record<string, string> = { name: 'o nome', phone: 'o telefone', personType: 'o tipo' }

function Form({ user }: { user: AuthUser }) {
  const navigate = useNavigate()
  const { updateUser } = useAuth()
  const save = useUpdateProfile()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const [name, setName] = useState(user.name)
  const [phone, setPhone] = useState(user.phone ? formatPhone(user.phone) : '')
  const [personType, setPersonType] = useState<PersonType>(user.personType)
  const invalid = Object.keys(feedback.fields)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    save.mutate(
      { name, phone, personType },
      {
        onSuccess: (updated) => {
          updateUser(updated)
          void navigate('/minha-conta', { state: { updated: true } })
        },
        onError: feedback.fail,
      },
    )
  }

  const summary =
    invalid.length === 1 ? `Confira ${FIELD_NAMES[invalid[0]!] ?? 'o campo'} marcado abaixo.` : invalid.length > 1 ? 'Confira os campos marcados abaixo.' : feedback.error?.message

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4 pb-24 desktop:pb-0">
      <h1 className="m-0 text-[1.875rem] leading-[1.1] font-bold desktop:text-h1-desktop">Alterar meus dados</h1>
      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {summary}
        </Alert>
      )}
      <TextField label="Nome" name="name" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} error={feedback.fields.name} />
      <TextField
        label="Telefone"
        labelNote="com DDD"
        type="tel"
        name="phone"
        autoComplete="tel"
        inputMode="tel"
        value={phone}
        onChange={(event) => setPhone(event.target.value)}
        error={feedback.fields.phone}
      />
      <SegmentedField legend="Você é" name="personType" options={OPTIONS} value={personType} onChange={setPersonType} error={feedback.fields.personType} />
      <div className="flex flex-col gap-1">
        <p className="m-0 text-[0.9375rem] font-semibold">E-mail</p>
        <p className="m-0 text-body break-words">{user.email}</p>
        <p className="m-0 text-[0.84375rem] text-brown-400">
          Não muda por aqui: seria preciso confirmar o endereço novo por e-mail. Fale com a gente pelo WhatsApp <a href={CONTACTS.whatsapp}>{CONTACTS.phoneDisplay}</a>.
        </p>
      </div>
      <ActionBar
        secondaryFirst
        primary={
          <Button type="submit" variant="applique" loading={save.isPending} className="min-h-13 w-full desktop:w-auto desktop:px-8">
            Salvar
          </Button>
        }
        secondary={
          <Link to="/minha-conta" className="inline-flex min-h-13 items-center px-3 text-[0.9375rem] font-semibold text-blue-deep no-underline hover:text-brown">
            Cancelar
          </Link>
        }
      />
    </form>
  )
}

export function AccountEdit() {
  const { user } = useAuth()
  return user ? <Form user={user} /> : null
}
