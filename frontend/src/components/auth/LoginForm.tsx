import { useState, type FormEvent } from 'react'
import { Alert, Button, PasswordField, TextField } from '../ui'
import { useLogin, type AuthResult } from '../../services/auth'
import { useFormFeedback } from './use-form-feedback'

export function LoginForm({ onSuccess }: { onSuccess: (result: AuthResult) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const login = useLogin()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    login.mutate({ email, password }, { onSuccess, onError: feedback.fail })
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      {feedback.error && (
        <Alert ref={alertRef} tone="error">
          {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
        </Alert>
      )}
      <TextField
        label="E-mail"
        type="email"
        name="email"
        autoComplete="email"
        inputMode="email"
        autoCapitalize="none"
        required
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        error={feedback.fields.email}
      />
      <PasswordField
        label="Senha"
        name="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        error={feedback.fields.password}
      />
      <Button type="submit" variant="applique" fullWidth loading={login.isPending}>
        Entrar
      </Button>
    </form>
  )
}
