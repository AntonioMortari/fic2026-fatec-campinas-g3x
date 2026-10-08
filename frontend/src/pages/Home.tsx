import { HomeHero } from '../components/home/HomeHero'
import { NextActivity } from '../components/home/NextActivity'
import { SchoolsBanner } from '../components/home/SchoolsBanner'
import { StartingPoints } from '../components/home/StartingPoints'
import { WhatWeDo } from '../components/home/WhatWeDo'
import { Container } from '../components/ui'
import type { UpcomingEvent } from '../types/event'

export function Home({ nextEvent = null }: { nextEvent?: UpcomingEvent | null }) {
  return (
    <>
      <HomeHero />
      <Container
        className={
          nextEvent
            ? 'flex flex-col gap-9 pt-8 desktop:grid desktop:grid-cols-[5fr_7fr] desktop:items-start desktop:gap-12 desktop:pt-14'
            : 'pt-9 desktop:pt-14'
        }
      >
        {nextEvent && <NextActivity event={nextEvent} />}
        <StartingPoints wide={!nextEvent} />
      </Container>
      <div className="pt-9 desktop:pt-20">
        <WhatWeDo />
      </div>
      <div className="mt-9 desktop:mt-20">
        <SchoolsBanner />
      </div>
    </>
  )
}
