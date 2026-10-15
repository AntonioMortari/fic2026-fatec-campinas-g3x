import { HomeGallery } from '../components/home/HomeGallery'
import { HomeHero } from '../components/home/HomeHero'
import { HomeNews } from '../components/home/HomeNews'
import { NextActivity } from '../components/home/NextActivity'
import { OurStory } from '../components/home/OurStory'
import { PlacesWeWent } from '../components/home/PlacesWeWent'
import { SchoolsBanner } from '../components/home/SchoolsBanner'
import { StartingPoints } from '../components/home/StartingPoints'
import { WhatWeDo } from '../components/home/WhatWeDo'
import { WhereWeAre } from '../components/home/WhereWeAre'
import { Container } from '../components/ui'
import type { HomePhoto } from '../lib/gallery'
import type { EventSummary } from '../types/event'
import type { NewsItem } from '../types/news'

interface HomeProps {
  nextEvent?: EventSummary | null
  photos?: HomePhoto[]
  news?: NewsItem[]
}

// Designs 14a and 14b, in the order the design tells it: who we are and what we do, then what is inside (story, photos), schools, what is
// happening (news), and where to find us. What depends on something published disappears on its own when there is nothing.
// Left out because the site cannot back them yet: "Na mídia" (it needs the links of the reports) and "Quem já participou" (there is no
// way to send or approve a testimonial).
export function Home({ nextEvent = null, photos = [], news = [] }: HomeProps) {
  return (
    <>
      <HomeHero />
      {nextEvent && (
        <Container className="pt-9 desktop:pt-10">
          <NextActivity event={nextEvent} />
        </Container>
      )}
      <StartingPoints />
      <WhatWeDo />
      <OurStory />
      <HomeGallery photos={photos} />
      <SchoolsBanner />
      <HomeNews news={news} />
      <PlacesWeWent />
      <WhereWeAre />
    </>
  )
}
