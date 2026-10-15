import { Link } from 'react-router-dom'
import { PAST_VENUES, type Venue } from '../../lib/schools'
import { Container } from '../ui'

const GO_TO_SCHOOLS = 'Levar uma atividade para a sua escola →'

// The same places the schools page lists (design 14a: three columns with the detail of each; 14b: one column with a square marker).
export function PlacesWeWent({ venues = PAST_VENUES }: { venues?: Venue[] }) {
  if (venues.length === 0) return null

  return (
    <Container
      as="section"
      aria-labelledby="places-title"
      className="flex flex-col gap-3 pt-9 desktop:grid desktop:grid-cols-[18.75rem_minmax(0,1fr)] desktop:gap-12 desktop:pt-20"
    >
      <div className="flex flex-col gap-3">
        <h2 id="places-title" className="m-0 text-[1.5rem] leading-[1.15] font-bold desktop:text-[1.75rem] desktop:leading-[normal]">
          Onde já estivemos
        </h2>
        <p className="m-0 hidden text-[1rem] leading-[1.55] text-brown-600 desktop:block">Instituições e programações que já receberam o Ateliê.</p>
        <Link to="/para-escolas" className="hidden text-[0.9375rem] font-semibold text-blue-deep underline desktop:inline">
          {GO_TO_SCHOOLS}
        </Link>
      </div>
      <ul className="m-0 flex list-none flex-col border-t-[1.5px] border-brown p-0 desktop:grid desktop:grid-cols-3 desktop:gap-x-8 desktop:self-start">
        {venues.map((venue) => (
          <li key={venue.title} className="grid grid-cols-[0.625rem_minmax(0,1fr)] items-baseline gap-3 border-b border-brown/25 py-3 desktop:flex desktop:flex-col desktop:gap-0.5 desktop:py-3.5">
            <span aria-hidden="true" className="size-2 bg-ochre desktop:hidden" />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-[1rem] leading-[1.35] font-bold">{venue.title}</span>
              {venue.detail && <span className="text-[0.875rem] leading-[1.4] text-brown-400">{venue.detail}</span>}
            </span>
          </li>
        ))}
      </ul>
      <Link to="/para-escolas" className="flex min-h-11 items-center text-[0.9375rem] font-semibold text-blue-deep underline desktop:hidden">
        {GO_TO_SCHOOLS}
      </Link>
    </Container>
  )
}
