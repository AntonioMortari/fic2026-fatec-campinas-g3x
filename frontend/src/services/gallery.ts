import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { AdminPhoto, GalleryAlbum, PhotoUpload } from '../types/gallery'
import { api } from './api'

const KEY = ['gallery']
const ADMIN_KEY = ['admin-gallery']
// Not under ADMIN_KEY: invalidating the list would otherwise download every thumbnail again.
const IMAGE_KEY = ['admin-gallery-image']

export function useGallery() {
  return useQuery({ queryKey: KEY, queryFn: async () => (await api.get<{ data: GalleryAlbum[] }>('/gallery')).data.data })
}

export function useAdminPhotos() {
  return useQuery({ queryKey: ADMIN_KEY, queryFn: async () => (await api.get<{ data: AdminPhoto[] }>('/admin/gallery')).data.data })
}

export function useAdminPhoto(id: string | undefined) {
  return useQuery({
    queryKey: [...ADMIN_KEY, id],
    queryFn: async () => (await api.get<{ photo: AdminPhoto }>(`/admin/gallery/${id}`)).data.photo,
    enabled: Boolean(id),
    retry: false,
  })
}

function useRefreshAfterChange() {
  const queryClient = useQueryClient()
  return () => Promise.all([queryClient.invalidateQueries({ queryKey: ADMIN_KEY }), queryClient.invalidateQueries({ queryKey: KEY })])
}

export function useUploadPhoto() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (upload: PhotoUpload) =>
      (await api.post<{ photo: AdminPhoto }>('/admin/gallery', { ...upload, caption: upload.caption.trim() || null })).data.photo,
    onSuccess: refresh,
  })
}

export function useSetPhotoPublication() {
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async ({ id, published }: { id: string; published: boolean }) =>
      (await api.patch<{ photo: AdminPhoto }>(`/admin/gallery/${id}/publication`, { published })).data.photo,
    onSuccess: refresh,
  })
}

export function useDeletePhoto() {
  const queryClient = useQueryClient()
  const refresh = useRefreshAfterChange()
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/admin/gallery/${id}`)
    },
    onSuccess: (_result, id) => {
      queryClient.removeQueries({ queryKey: [...ADMIN_KEY, id] })
      return refresh()
    },
  })
}

// The panel's images are behind the session, so they are fetched with the token and shown from a blob.
export function useAdminPhotoImage(url: string | undefined) {
  return useQuery({
    queryKey: [...IMAGE_KEY, url],
    queryFn: async () => (await api.get<Blob>(String(url).replace(/^\/api/, ''), { responseType: 'blob' })).data,
    enabled: Boolean(url),
    staleTime: Infinity,
    retry: false,
  })
}

export function galleryImageSrc(url: string): string {
  const base = api.defaults.baseURL ?? ''
  return /^https?:\/\//.test(base) ? new URL(url, base).href : url
}
