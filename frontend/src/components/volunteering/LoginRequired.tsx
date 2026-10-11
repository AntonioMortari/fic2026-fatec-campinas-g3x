import { CONTACTS } from '../../lib/contacts'
import { ADULT_NOTE, APPLICATION_PATH, WHAT_HAPPENS_NEXT_STEPS } from '../../lib/volunteering'
import { Button, Card } from '../ui'
import { OrderedSteps } from './OrderedSteps'

export function LoginRequired() {
  return (
    <div className="flex max-w-xl flex-col gap-5 pb-10">
      <h1 className="m-0 pt-5.5 text-[1.875rem] leading-[1.1] font-bold text-pretty desktop:pt-4 desktop:text-h1-desktop">Candidatar-se ao voluntariado</h1>

      <Card elevation="outline" as="section" aria-labelledby="account-needed" className="flex flex-col gap-3 p-4">
        <h2 id="account-needed" className="m-0 text-[1.1875rem] leading-[1.25] font-bold">
          Para se candidatar é preciso ter uma conta
        </h2>
        <p className="m-0 text-[0.96875rem] leading-[1.55]">
          É pela conta que a sua candidatura fica ligada a você: você acompanha a situação dela em “Sua conta”, e a gente sabe com quem está falando quando entrar em contato.
        </p>
        <p className="m-0 text-small text-brown-400">{ADULT_NOTE}</p>
      </Card>

      <div className="flex flex-col gap-3.5">
        <Button to={`/entrar?voltar=${encodeURIComponent(APPLICATION_PATH)}`} variant="applique" className="w-full">
          Criar conta ou entrar
        </Button>
        <Button to="/voluntariado" variant="secondary" className="w-full">
          Ver as áreas
        </Button>
      </div>

      <p className="m-0 border-t border-line pt-4 text-[0.9375rem] leading-[1.55] text-brown-600">
        Se preferir não criar conta, fale com a gente pelo WhatsApp{' '}
        <a href={CONTACTS.whatsapp} className="font-bold text-brown">
          {CONTACTS.phoneDisplay}
        </a>{' '}
        ou pelo e-mail{' '}
        <a href={`mailto:${CONTACTS.email}`} className="font-bold text-brown">
          {CONTACTS.email}
        </a>{' '}
        — a gente conversa por ali do mesmo jeito.
      </p>

      <section aria-labelledby="what-next" className="flex flex-col gap-1.5">
        <h2 id="what-next" className="m-0 text-overline leading-[1.2] font-semibold uppercase tracking-[0.12em] text-brown-400">
          O que acontece depois
        </h2>
        <OrderedSteps steps={WHAT_HAPPENS_NEXT_STEPS} />
      </section>
    </div>
  )
}
