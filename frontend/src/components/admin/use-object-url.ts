import { useEffect, useMemo } from 'react'

export function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : null), [blob])
  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  return url
}
