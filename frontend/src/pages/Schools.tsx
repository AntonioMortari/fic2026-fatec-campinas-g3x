import { Link } from 'react-router-dom'
import { FaqHint } from '../components/faq/FaqHint'
import { PastVenues } from '../components/schools/PastVenues'
import { RequirementList } from '../components/schools/RequirementList'
import { SchoolsActions } from '../components/schools/SchoolsActions'
import { SpecSheet } from '../components/schools/SpecSheet'
import { Button, Container, PageHeader } from '../components/ui'
import { CATALOG_PATH, CONTACT_PATH, PAST_VENUES, REQUIREMENTS, SPEC_SHEET } from '../lib/schools'

const STACK = 'flex flex-col gap-2.5 desktop:gap-3'
const RULE = 'border-t-[1.5px] border-brown pt-4.5 desktop:pt-5'
const H2 = 'm-0 text-[1.3125rem] leading-[1.2] font-bold desktop:text-[1.625rem]'

export function Schools() {
  return (
    <>
      <div className="desktop:mx-auto desktop:grid desktop:max-w-page desktop:grid-cols-2 desktop:items-center desktop:gap-x-16 desktop:px-8">
        <img
          src="/images/sector-literary.jpg"
          alt="Wil Oliveira, cofundador do ateliê, sorri deitado entre exemplares do livro infantil Cafú e o Café, de sua autoria."
          width={1000}
          height={500}
          className="block aspect-video w-full object-cover desktop:col-start-2 desktop:row-start-1 desktop:aspect-[2/1] desktop:shadow-[8px_8px_0_var(--color-ochre)]"
        />
        <div className="px-4 desktop:col-start-1 desktop:row-start-1 desktop:px-0">
          <PageHeader
            overline="Para escolas"
            overlineTone="blue"
            title="Para escolas e instituições"
            lead="Levamos contações de história performáticas e vivências brincantes até o seu espaço, trabalhando cultura e memória afro-brasileira com as crianças."
            titleClassName="desktop:[text-wrap:balance]"
            className="pt-5.5! pb-6! desktop:pt-14! desktop:pb-0!"
          />
          <SchoolsActions placement="hero" className="hidden desktop:flex desktop:flex-wrap desktop:gap-3 desktop:pt-5" />
        </div>
      </div>

      <Container className="flex flex-col gap-6 pb-10 desktop:grid desktop:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] desktop:gap-x-16 desktop:gap-y-9 desktop:pt-14 desktop:pb-18">
        <section aria-labelledby="activities-title" className={`${STACK} ${RULE} order-1 desktop:col-start-1 desktop:row-start-1`}>
          <h2 id="activities-title" className={H2}>
            Que atividades existem
          </h2>
          <p className="m-0 text-[0.96875rem] leading-[1.55] desktop:text-[1.0625rem] desktop:leading-[1.6]">
            Nosso catálogo reúne contações de história performáticas, apresentações com fantoches e música ao vivo, e vivências de brincadeiras da cultura popular.
          </p>
          <Button to={CATALOG_PATH} variant="secondary" className="min-h-12! w-full text-[0.9375rem] desktop:w-auto desktop:self-start desktop:px-5">
            Ver o catálogo completo
          </Button>
        </section>

        <section aria-labelledby="requirements-title" className={`${STACK} ${RULE} order-3 desktop:order-none desktop:col-start-1 desktop:row-start-2`}>
          <h2 id="requirements-title" className={H2}>
            O que a escola precisa providenciar
          </h2>
          <RequirementList items={REQUIREMENTS} />
          <p className="m-0 text-small leading-[1.5] text-brown-400 desktop:text-[0.9375rem]">A ficha técnica de cada atividade traz o que ela pede em detalhe.</p>
        </section>

        <PastVenues venues={PAST_VENUES} className={`flex flex-col ${RULE} order-4 desktop:order-none desktop:col-start-1 desktop:row-start-3`} />

        <div className="contents desktop:col-start-2 desktop:row-span-3 desktop:row-start-1 desktop:flex desktop:flex-col desktop:gap-6 desktop:self-start desktop:border-[1.5px] desktop:border-brown desktop:bg-card desktop:p-7">
          <section aria-labelledby="spec-title" className={`${STACK} order-2 border-t-[1.5px] border-brown pt-4.5 desktop:order-none desktop:border-t-0 desktop:pt-0`}>
            <h2 id="spec-title" className={`${H2} desktop:text-h2`}>
              Formato e duração
            </h2>
            <SpecSheet rows={SPEC_SHEET} />
          </section>

          <section
            aria-labelledby="request-title"
            className={`${STACK} order-5 border-[1.5px] border-brown bg-card px-4 pt-4.5 pb-4.5 desktop:order-none desktop:border-0 desktop:border-t-[1.5px] desktop:bg-transparent desktop:px-0 desktop:pt-5 desktop:pb-0`}
          >
            <h2 id="request-title" className={`${H2} desktop:text-h2`}>
              Solicitar uma atividade
            </h2>
            <p className="m-0 text-[0.96875rem] leading-[1.55] desktop:text-[0.96875rem]">
              Conte para a gente qual atividade interessou, quantas crianças participariam e qual período você tem em mente. Respondemos pelo mesmo canal que você escolher.
            </p>
            <FaqHint
              links={[
                { id: 'escola-providenciar', text: 'O que a escola precisa providenciar?' },
                { id: 'escola-duracao', text: 'Quanto dura e qual é a classificação?' },
              ]}
            />
            <SchoolsActions placement="card" className="hidden desktop:flex desktop:flex-col desktop:gap-3" />
            <Link to={CONTACT_PATH} className="inline-flex min-h-11 items-center text-[0.90625rem] font-semibold">
              Prefere escrever por aqui? Use o formulário
            </Link>
          </section>
        </div>
      </Container>

      <div className="sticky bottom-[calc(3.5rem+1.5px+max(1rem,env(safe-area-inset-bottom)))] z-20 border-t border-line bg-cream desktop:hidden">
        <SchoolsActions placement="bar" className="mx-auto flex max-w-xl flex-col gap-y-0.5 py-2.5 pr-5.5 pl-4 min-[24rem]:flex-row min-[24rem]:items-center min-[24rem]:gap-x-3" />
      </div>
    </>
  )
}
