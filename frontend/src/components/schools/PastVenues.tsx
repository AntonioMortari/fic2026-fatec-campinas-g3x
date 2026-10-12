import type { Venue } from '../../lib/schools'

export function PastVenues({ venues, className }: { venues: Venue[]; className?: string }) {
  if (venues.length === 0) return null

  return (
    <section aria-labelledby="past-venues-title" className={className}>
      <h2 id="past-venues-title" className="m-0 mb-1.5 text-[1.3125rem] leading-[1.2] font-bold desktop:mb-0 desktop:text-[1.625rem]">
        Onde já estivemos
      </h2>
      <ul className="m-0 grid list-none grid-cols-1 gap-x-8 p-0 desktop:mt-3 desktop:grid-cols-2">
        {venues.map((venue) => (
          <li key={venue.title} className="flex flex-col gap-0.5 border-t border-line py-2.5">
            <span className="text-[0.9375rem] font-bold desktop:text-[0.96875rem]">{venue.title}</span>
            {venue.detail && <span className="text-[0.84375rem] text-brown-400 desktop:text-small">{venue.detail}</span>}
          </li>
        ))}
      </ul>
    </section>
  )
}
