import { useState, type FormEvent } from 'react'
import { PERSON_TYPE_LABELS } from '../../lib/person-type'
import { useRegister, type AuthResult, type PersonType, type RegisterInput } from '../../services/auth'
import { Alert, Button, Checkbox, FieldMessages, PasswordField, SelectField, TextField } from '../ui'
import { useFormFeedback } from './use-form-feedback'

const PERSON_TYPE_OPTIONS = (Object.keys(PERSON_TYPE_LABELS) as PersonType[]).map((value) => ({
  value,
  label: PERSON_TYPE_LABELS[value],
}))

const EMPTY: Omit<RegisterInput, 'phone'> & { phone: string } = {
  name: '',
  email: '',
  phone: '',
  personType: '',
  password: '',
  wantsToVolunteer: false,
  wantsToDonate: false,
  confirmsAdult: false,
  consent: false,
}

export function RegisterForm({ onSuccess }: { onSuccess: (result: AuthResult) => void }) {
  const [values, setValues] = useState(EMPTY)
  const register = useRegister()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0

  function set<K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    const phone = values.phone.trim()
    register.mutate({ ...values, phone: phone === '' ? null : phone }, { onSuccess, onError: feedback.fail })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
        </Alert>
      )}
      <TextField
        label="Nome completo"
        name="name"
        autoComplete="name"
        required
        value={values.name}
        onChange={(event) => set('name', event.target.value)}
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
        hint="É por aqui que respondemos você."
        value={values.email}
        onChange={(event) => set('email', event.target.value)}
        error={feedback.fields.email}
      />
      <TextField
        label="Telefone"
        type="tel"
        name="phone"
        autoComplete="tel"
        inputMode="tel"
        hint="Opcional. Com DDD, como (11) 95396-8344."
        value={values.phone}
        onChange={(event) => set('phone', event.target.value)}
        error={feedback.fields.phone}
      />
      <SelectField
        label="Esta conta é de"
        name="personType"
        required
        options={PERSON_TYPE_OPTIONS}
        value={values.personType}
        onChange={(event) => set('personType', event.target.value as PersonType | '')}
        error={feedback.fields.personType}
      />
      <PasswordField
        label="Senha"
        name="password"
        autoComplete="new-password"
        required
        hint="Pelo menos 8 caracteres."
        value={values.password}
        onChange={(event) => set('password', event.target.value)}
        error={feedback.fields.password}
      />

      <fieldset className="m-0 flex flex-col gap-1 border-0 p-0" aria-describedby={feedback.fields.participation ? 'participation-error' : undefined}>
        <legend className="mb-1 p-0 text-[0.9375rem] font-semibold">Como você quer participar?</legend>
        <Checkbox
          label="Quero ser voluntário ou voluntária"
          name="wantsToVolunteer"
          checked={values.wantsToVolunteer}
          onChange={(event) => set('wantsToVolunteer', event.target.checked)}
        />
        <Checkbox
          label="Quero doar ou apoiar"
          name="wantsToDonate"
          checked={values.wantsToDonate}
          onChange={(event) => set('wantsToDonate', event.target.checked)}
        />
        <FieldMessages error={feedback.fields.participation} errorId="participation-error" />
      </fieldset>

      <Checkbox
        label="Confirmo que tenho 18 anos ou mais"
        name="confirmsAdult"
        hint="Crianças e adolescentes participam das atividades por inscrição feita por um responsável."
        checked={values.confirmsAdult}
        onChange={(event) => set('confirmsAdult', event.target.checked)}
        error={feedback.fields.confirmsAdult}
      />
      <Checkbox
        label="Concordo com o uso dos meus dados"
        name="consent"
        hint="Usamos seus dados só para falar com você sobre as atividades do Ateliê."
        checked={values.consent}
        onChange={(event) => set('consent', event.target.checked)}
        error={feedback.fields.consent}
      />

      <Button type="submit" variant="applique" fullWidth loading={register.isPending}>
        Criar conta
      </Button>
    </form>
  )
}
