import { cn } from '../../lib/cn'
import { formatPhone } from '../../lib/format-phone'
import type { AdminRegistration } from '../../types/admin-registration'
import { Card, Chevron } from '../ui'

function formatCpf(digits: string): string {
  return digits.replace(/^(\d{3})(\d{3})(\d{3})(\d{2})$/, '$1.$2.$3-$4')
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-small text-brown-400">{label}</dt>
      <dd className="m-0 break-words">{children}</dd>
    </div>
  )
}

const LINK = 'inline-flex min-h-11 items-center underline'

export function RegistrantCard({ registration }: { registration: AdminRegistration }) {
  const { name, email, phone, cpf, isMinor, guardianName, guardianPhone, imageAuthorized, hasAccount } = registration

  return (
    <Card as="li" className="flex flex-col gap-3 p-4">
      <div className="flex min-w-0 flex-col gap-2">
        <h3 className="m-0 text-h3 leading-tight font-bold break-words">{name}</h3>
        <div className="flex flex-wrap gap-1.5">
          <span
            className={cn(
              'border-[1.5px] border-brown px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em]',
              imageAuthorized ? 'bg-brown text-cream' : 'bg-transparent text-brown',
            )}
          >
            {imageAuthorized ? 'Autorizou imagem' : 'Não autorizou imagem'}
          </span>
          {isMinor && (
            <span className="border-[1.5px] border-brown bg-transparent px-2 py-0.5 text-[0.6875rem] font-bold uppercase tracking-[0.1em]">
              Menor de idade
            </span>
          )}
        </div>
      </div>

      <details className="group border-t border-line pt-1">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-2 font-semibold [&::-webkit-details-marker]:hidden">
          <span>
            Contato e dados <span className="sr-only">de {name}</span>
          </span>
          <span className="inline-flex transition-transform group-open:rotate-180">
            <Chevron direction="down" />
          </span>
        </summary>
        <dl className="m-0 mt-2 flex flex-col gap-3 text-[0.9375rem]">
          <Row label="E-mail">
            <a className={LINK} href={`mailto:${email}`}>
              {email}
            </a>
          </Row>
          <Row label="Telefone">
            {phone ? (
              <a className={LINK} href={`tel:${phone}`}>
                {formatPhone(phone)}
              </a>
            ) : (
              'Não informado'
            )}
          </Row>
          {cpf && <Row label="CPF">{formatCpf(cpf)}</Row>}
          {isMinor && (
            <>
              <Row label="Responsável">{guardianName}</Row>
              <Row label="Telefone do responsável">
                {guardianPhone ? (
                  <a className={LINK} href={`tel:${guardianPhone}`}>
                    {formatPhone(guardianPhone)}
                  </a>
                ) : (
                  'Não informado'
                )}
              </Row>
            </>
          )}
          <Row label="Conta no site">{hasAccount ? 'Inscrito com conta' : 'Inscrito sem conta'}</Row>
        </dl>
      </details>
    </Card>
  )
}
