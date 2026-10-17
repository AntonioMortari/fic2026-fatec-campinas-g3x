import { AboutCallToAction } from '../components/about/AboutCallToAction'
import { AboutHero } from '../components/about/AboutHero'
import { AudienceStatement } from '../components/about/AudienceStatement'
import { FoundersSection } from '../components/about/FoundersSection'
import { LocationSection } from '../components/about/LocationSection'
import { SankofaSection } from '../components/about/SankofaSection'
import { SectionIndex } from '../components/about/SectionIndex'
import { SectorsSection } from '../components/about/SectorsSection'
import { Reveal } from '../components/ui'
import { DESKTOP_QUERY, useMediaQuery } from '../lib/use-media-query'

// Designs 15a (desktop) and 15b (phone). Some blocks have two texts, the full one of the ONG on the desktop and the shorter one on
// the phone, and the index lives in a different place, so the page chooses once and passes the choice down.
export function About() {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  return (
    <>
      <AboutHero desktop={desktop} index={desktop ? <SectionIndex variant="chips" /> : null} />
      {!desktop && <SectionIndex variant="bar" />}
      <Reveal><SankofaSection desktop={desktop} /></Reveal>
      <Reveal><FoundersSection desktop={desktop} /></Reveal>
      <Reveal><SectorsSection /></Reveal>
      <Reveal><AudienceStatement /></Reveal>
      <Reveal><LocationSection desktop={desktop} /></Reveal>
      <Reveal><AboutCallToAction /></Reveal>
    </>
  )
}
