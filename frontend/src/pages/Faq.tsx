import { useEffect, useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Button, Container, EmptyState, LoadingState, PageHeader, StripedBand } from '../components/ui'
import { CONTACTS } from '../lib/contacts'
import { filterFaq, searchWords } from '../lib/faq'
import { revealElement } from '../lib/motion'
import { usePublicFaq } from '../services/faq'
import type { PublicFaqQuestion } from '../types/faq'

const THEME_OVERLINE = 'm-0 text-[0.8125rem] leading-[normal] font-bold uppercase tracking-[0.12em] text-ochre-deep desktop:text-[1.625rem] desktop:tracking-normal desktop:normal-case desktop:text-brown'

function Answer({ item }: { item: PublicFaqQuestion }) {
  return (
    <div className="flex flex-col gap-2 pb-4 text-[0.96875rem] leading-[1.6] desktop:pr-11 desktop:pb-5 desktop:text-[1.0625rem] desktop:leading-[1.65]">
      {item.answer.split('\n\n').map((paragraph) => (
        <p key={paragraph} className="m-0">
          {paragraph}
        </p>
      ))}
      {item.link && (
        <Link to={item.link.to} className="inline-flex min-h-11 items-center self-start font-semibold">
          {item.link.label} <span aria-hidden="true">&nbsp;→</span>
        </Link>
      )}
    </div>
  )
}

function Question({ item, open, onToggle }: { item: PublicFaqQuestion; open: boolean; onToggle: () => void }) {
  return (
    <div id={item.id} className="scroll-mt-24 border-t-[1.5px] border-brown">
      <h3 className="m-0">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={`resposta-${item.id}`}
          onClick={onToggle}
          className="grid min-h-14 w-full cursor-pointer grid-cols-[minmax(0,1fr)_1.625rem] items-center gap-3 border-0 bg-transparent py-3 text-left text-[1.03125rem] leading-[1.35] font-bold text-brown desktop:min-h-15 desktop:grid-cols-[minmax(0,1fr)_1.75rem] desktop:gap-4 desktop:py-3.5 desktop:text-[1.15625rem]"
        >
          {item.question}
          <span
            aria-hidden="true"
            className={`grid size-6.5 place-items-center border-[1.5px] border-brown text-base leading-none desktop:size-7 desktop:text-lg ${open ? 'bg-ochre' : 'bg-transparent'}`}
          >
            {open ? '−' : '+'}
          </span>
        </button>
      </h3>
      <div id={`resposta-${item.id}`} hidden={!open}>
        <Answer item={item} />
      </div>
    </div>
  )
}

export function Faq() {
  const { hash } = useLocation()
  const [term, setTerm] = useState('')
  const [opened, setOpened] = useState<Record<string, boolean>>({})
  const linkedId = decodeURIComponent(hash.slice(1))
  const isOpen = (id: string) => searching || (opened[id] ?? id === linkedId)

  const faq = usePublicFaq()
  const themes = faq.data
  const searching = searchWords(term).length > 0
  const groups = useMemo(() => filterFaq(themes ?? [], term), [themes, term])
  const foundCount = groups.reduce((total, theme) => total + theme.items.length, 0)
  const total = (themes ?? []).reduce((sum, theme) => sum + theme.items.length, 0)

  useEffect(() => {
    if (!linkedId || !themes?.some((theme) => theme.items.some((item) => item.id === linkedId))) return
    const timer = window.setTimeout(() => {
      const target = document.getElementById(linkedId)
      if (target) revealElement(target, 'start')
    }, 50)
    return () => window.clearTimeout(timer)
  }, [linkedId, themes])

  const search = (
    <form role="search" aria-label="Buscar nas perguntas" onSubmit={(event) => event.preventDefault()} className="flex flex-col gap-1.5 desktop:w-[28.75rem]">
      <label htmlFor="faq-search" className="text-[0.9375rem] leading-[1.2] font-semibold">
        Buscar nas perguntas
      </label>
      <div className="grid grid-cols-[minmax(0,1fr)_auto]">
        <input
          id="faq-search"
          type="search"
          maxLength={80}
          value={term}
          onChange={(event) => setTerm(event.target.value)}
          placeholder="Ex.: escola, imagem, voluntário"
          className="min-h-13 min-w-0 border-[1.5px] border-r-0 border-brown bg-card px-3.5 text-body text-brown placeholder:text-brown-300 focus-visible:outline-offset-2"
        />
        <button type="submit" className="min-h-13 cursor-pointer border-[1.5px] border-brown bg-brown px-4 text-body font-semibold text-cream desktop:px-5.5">
          Buscar
        </button>
      </div>
    </form>
  )

  return (
    <>
      <Container>
        <PageHeader
          title="Perguntas frequentes"
          lead={
            <>
              Respostas rápidas para as dúvidas mais comuns.<span className="hidden desktop:inline"> Não achou a sua? </span>
              <Link to="/contato" className="hidden desktop:inline">
                Fale com a gente
              </Link>
              <span className="hidden desktop:inline">.</span>
            </>
          }
          leadClassName="border-l-4 border-ochre pl-3 desktop:pl-4"
          aside={search}
          className="pb-0! desktop:pt-14!"
        />
      </Container>
      <div className="mt-5 desktop:mx-auto desktop:mt-8 desktop:max-w-page desktop:px-8">
        <StripedBand />
      </div>

      <Container className="grid grid-cols-1 gap-7 pt-5 pb-12 desktop:grid-cols-[15rem_minmax(0,1fr)] desktop:items-start desktop:gap-16 desktop:pt-10 desktop:pb-22">
        <nav aria-label="Temas" className="hidden desktop:sticky desktop:top-6 desktop:flex desktop:flex-col">
          <span className="pb-2 text-[0.75rem] font-bold uppercase tracking-[0.12em] text-ochre-deep">Temas</span>
          <ul className="m-0 list-none p-0">
            {(themes ?? []).map((theme) => {
              const count = groups.find((group) => group.id === theme.id)?.items.length ?? 0
              return (
                <li key={theme.id} className="border-t border-line">
                  {count > 0 ? (
                    <a href={`#tema-${theme.id}`} className="flex min-h-11 items-center justify-between text-[0.96875rem] font-semibold text-brown no-underline">
                      {theme.name}
                      <span className="text-[0.8125rem] font-bold text-brown-400">{count}</span>
                    </a>
                  ) : (
                    <span className="flex min-h-11 items-center justify-between text-[0.96875rem] font-semibold text-brown-300">
                      {theme.name}
                      <span className="text-[0.8125rem] font-bold">0</span>
                    </span>
                  )}
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex max-w-[48.75rem] flex-col gap-7 desktop:gap-10">
          {searching && (
            <p role="status" className="m-0 font-semibold">
              {foundCount === 0 ? 'Nenhuma pergunta encontrada' : foundCount === 1 ? '1 pergunta encontrada' : `${foundCount} perguntas encontradas`} ·{' '}
              <button type="button" onClick={() => setTerm('')} className="inline-flex min-h-11 cursor-pointer items-center border-0 bg-transparent p-0 font-semibold text-blue-deep underline">
                ver todas
              </button>
            </p>
          )}

          {searching && foundCount === 0 && (
            <div className="flex flex-col gap-3 border-[1.5px] border-dashed border-brown p-4.5 desktop:gap-3.5 desktop:p-6">
              <p className="m-0 text-[1.0625rem] leading-[1.3] font-bold desktop:text-[1.1875rem]">Nenhuma pergunta com essas palavras.</p>
              <p className="m-0 text-[0.9375rem] leading-[1.5] desktop:text-[1.03125rem] desktop:leading-[1.55]">Tente outra palavra ou fale com a gente.</p>
              <div className="flex flex-col gap-2.5 desktop:flex-row">
                <Button href={CONTACTS.whatsapp} target="_blank" rel="noreferrer" variant="support" className="min-h-12">
                  Falar no WhatsApp
                </Button>
                <Button to="/contato" variant="secondary" className="min-h-12">
                  Escrever uma mensagem
                </Button>
              </div>
            </div>
          )}

          {faq.isPending && (
            <LoadingState label="Carregando as perguntas…" shape="rows" count={4} />
          )}
          {faq.isError && (
            <EmptyState
              tone="error"
              title="Não conseguimos carregar as perguntas"
              text="Tente de novo em alguns minutos. Se preferir, fale com a gente."
              actions={
                <Button variant="secondary" size="compact" onClick={() => void faq.refetch()}>
                  Tentar de novo
                </Button>
              }
            />
          )}
          {faq.isSuccess && total === 0 && <EmptyState title="Ainda não há perguntas por aqui" text="Fale com a gente pelo WhatsApp ou pelo formulário de contato." />}

          {groups.map(({ id, name, items }) => (
            <section key={id} id={`tema-${id}`} aria-labelledby={`titulo-${id}`} className="flex scroll-mt-6 flex-col">
              <h2 id={`titulo-${id}`} className={`${THEME_OVERLINE} mb-2 desktop:mb-2.5`}>
                {name}
              </h2>
              {items.map((item) => (
                <Question key={item.id} item={item} open={isOpen(item.id)} onToggle={() => setOpened((current) => ({ ...current, [item.id]: !isOpen(item.id) }))} />
              ))}
            </section>
          ))}

          <aside
            aria-labelledby="faq-more"
            className="flex flex-col gap-2.5 border-[1.5px] border-brown bg-card p-4.5 shadow-[5px_5px_0_var(--color-brown)] desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-6 desktop:px-7 desktop:py-6 desktop:shadow-[6px_6px_0_var(--color-brown)]"
          >
            <div className="flex flex-col gap-1">
              <h2 id="faq-more" className="m-0 text-[1.125rem] leading-[1.3] font-bold desktop:text-xl">
                Ficou alguma dúvida?
              </h2>
              <p className="m-0 hidden text-brown-600 desktop:block">A gente responde pelo WhatsApp, pelo e-mail ou pelo formulário.</p>
            </div>
            <Button to="/contato" variant="primary" className="min-h-12.5 desktop:min-h-13 desktop:flex-none desktop:px-5.5">
              Falar com a gente
            </Button>
          </aside>
        </div>
      </Container>
    </>
  )
}
