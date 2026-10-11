import { AboutCallToAction } from '../components/about/AboutCallToAction'
import { AboutHero } from '../components/about/AboutHero'
import { AudienceStatement } from '../components/about/AudienceStatement'
import { FoundersSection } from '../components/about/FoundersSection'
import { LocationSection } from '../components/about/LocationSection'
import { SankofaSection } from '../components/about/SankofaSection'
import { SectionIndex } from '../components/about/SectionIndex'
import { SectorsSection } from '../components/about/SectorsSection'

const READING_COLUMN = 'desktop:mx-auto desktop:max-w-[45rem]'

export function About() {
  return (
    <>
      <AboutHero />
      <SectionIndex />
      <div className={READING_COLUMN}>
        <SankofaSection />
        <FoundersSection />
      </div>
      <SectorsSection />
      <div className={READING_COLUMN}>
        <AudienceStatement />
        <LocationSection />
      </div>
      <AboutCallToAction />
    </>
  )
}
