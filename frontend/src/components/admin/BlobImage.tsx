import { useEffect, useRef } from 'react'

// The address is made and revoked inside the effect, not during render: StrictMode runs the cleanup of a freshly
// mounted component once, which would revoke an address made at render time and leave a cached image broken.
export function BlobImage({ blob, alt = '', className }: { blob: Blob; alt?: string; className?: string }) {
  const image = useRef<HTMLImageElement>(null)

  useEffect(() => {
    const element = image.current
    if (!element || typeof URL.createObjectURL !== 'function') return
    const url = URL.createObjectURL(blob)
    element.src = url
    return () => URL.revokeObjectURL(url)
  }, [blob])

  return <img ref={image} alt={alt} className={className} />
}
