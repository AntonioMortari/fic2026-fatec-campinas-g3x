import { useParams } from 'react-router-dom'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { AdminGallery } from './AdminGallery'
import { AdminGalleryEdit } from './AdminGalleryEdit'

export function AdminGalleryEditRoute() {
  const { id } = useParams()
  const desktop = useMediaQuery(DESKTOP_QUERY)
  return desktop ? <AdminGallery /> : <AdminGalleryEdit id={id} />
}
