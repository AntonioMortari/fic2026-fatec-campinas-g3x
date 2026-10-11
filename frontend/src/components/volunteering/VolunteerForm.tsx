import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useFormFeedback } from '../auth/use-form-feedback'
import { formatPhone } from '../../lib/format-phone'
import { MESSAGE_LIMIT, WHAT_HAPPENS_NEXT_STEPS } from '../../lib/volunteering'
import { useApplyToVolunteer } from '../../services/volunteering'
import type { AuthUser } from '../../services/auth'
import type { VolunteerArea } from '../../types/volunteering'
import { ActionBar, Alert, BackLink, Button, Card, TextAreaField } from '../ui'
import { AreaPicker } from './AreaPicker'
import { OrderedSteps } from './OrderedSteps'

interface VolunteerFormProps {
  areas: VolunteerArea[]
  user: AuthUser
  onSent: () => void
}

function Counter({ length }: { length: number }) {
  const over = length > MESSAGE_LIMIT
  return (
    <p className={over ? 'm-0 text-right text-[0.78125rem] font-bold text-error' : 'm-0 text-right text-[0.78125rem] font-semibold text-brown-400'}>
      {length} / {MESSAGE_LIMIT}
    </p>
  )
}

export function VolunteerForm({ areas, user, onSent }: VolunteerFormProps) {
  const apply = useApplyToVolunteer()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const [selected, setSelected] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const firstName = user.name.split(' ')[0]
  const tooLong = message.length > MESSAGE_LIMIT
  const areaError = feedback.fields.areas
  const messageError = tooLong ? `O texto passou de ${MESSAGE_LIMIT} caracteres.` : feedback.fields.message
  const summary = areaError ?? (feedback.fields.message ? 'Confira o texto marcado abaixo.' : feedback.error?.message)

  function toggle(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((entry) => entry !== id) : [...current, id]))
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    apply.mutate({ areas: selected, message }, { onSuccess: onSent, onError: feedback.fail })
  }

  return (
    <div className="flex flex-col pb-24 desktop:grid desktop:grid-cols-[minmax(0,1fr)_30rem] desktop:items-start desktop:gap-x-18 desktop:pt-4 desktop:pb-16">
      <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex min-w-0 flex-col gap-5">
        <header className="flex flex-col gap-1 pt-6 desktop:gap-2.5 desktop:pt-0">
          <div className="hidden desktop:block">
            <BackLink to="/voluntariado" label="Voluntariado" tone="link" />
          </div>
          <p className="m-0 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-blue-deep desktop:hidden">Olá, {firstName}</p>
          <h1 className="m-0 text-[1.875rem] leading-[1.1] font-bold text-pretty desktop:text-h1-desktop">
            <span className="desktop:hidden">Sua candidatura</span>
            <span className="hidden desktop:inline">Candidatar-se ao voluntariado</span>
          </h1>
          <p className="m-0 hidden text-[1.1875rem] text-brown-600 desktop:block">
            Escolha as áreas em que você quer ajudar e conte um pouco de você — a gente lê e entra em contato para conversar.
          </p>
        </header>

        {feedback.error && (
          <Alert ref={alertRef} tone="error">
            {summary}
          </Alert>
        )}

        <AreaPicker areas={areas} selected={selected} onToggle={toggle} />

        <div className="flex flex-col gap-1.5">
          <TextAreaField
            label={
              <>
                Quer contar alguma coisa?<span className="hidden font-normal text-brown-400 desktop:inline"> opcional</span>
              </>
            }
            name="message"
            rows={4}
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            error={messageError}
            hint={
              <>
                <span className="desktop:hidden">Opcional. </span>
                Dias e horários que dão para você, o que você já fez, o que quer aprender — o que ajudar a gente a começar a conversa.
              </>
            }
          />
          <Counter length={message.length} />
        </div>

        <ActionBar
          wrap
          primary={
            <Button type="submit" variant="applique" loading={apply.isPending} className="min-h-13 w-full desktop:w-auto desktop:px-8">
              Enviar minha candidatura
            </Button>
          }
        />
      </form>

      <aside aria-label="Sobre o envio" className="mt-8 hidden desktop:mt-2 desktop:block">
        <Card elevation="flat" className="flex flex-col gap-4 p-6">
          <section aria-labelledby="sending-as" className="flex flex-col gap-1">
            <h2 id="sending-as" className="m-0 text-overline font-semibold uppercase tracking-[0.12em] text-brown-400">
              Enviando como
            </h2>
            <p className="m-0 text-item font-bold">{user.name}</p>
            <p className="m-0 text-[0.9375rem] break-words">
              {user.email}
              {user.phone && ` · ${formatPhone(user.phone)}`}
            </p>
            <p className="m-0 text-small text-brown-400">
              É por aqui que a equipe vai falar com você. Dados errados? <Link to="/minha-conta/dados">Alterar meus dados</Link>.
            </p>
          </section>
          <section aria-labelledby="what-next" className="flex flex-col gap-3 border-t border-line pt-5">
            <h2 id="what-next" className="m-0 text-[1.125rem] leading-[1.25] font-bold">
              O que acontece depois
            </h2>
            <OrderedSteps steps={WHAT_HAPPENS_NEXT_STEPS} />
          </section>
          <p className="m-0 border-t border-line pt-4 text-[0.9375rem] text-brown-600">
            Dúvida antes de enviar? <Link to="/contato">Fale com a gente</Link>.
          </p>
        </Card>
      </aside>
    </div>
  )
}
