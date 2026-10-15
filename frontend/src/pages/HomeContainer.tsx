import { useMemo } from 'react'
import { recentPhotos } from '../lib/gallery'
import { useNextEvent } from '../services/events'
import { useGallery } from '../services/gallery'
import { useNewsList } from '../services/news'
import { Home } from './Home'

// Each block asks for its own data and says nothing when it fails or is empty: the home never shows an error for something it can leave out.
export function HomeContainer() {
  const { data: nextEvent } = useNextEvent()
  const { data: albums } = useGallery()
  const { data: news } = useNewsList()
  const photos = useMemo(() => recentPhotos(albums ?? [], 5), [albums])
  return <Home nextEvent={nextEvent ?? null} photos={photos} news={news ?? []} />
}
