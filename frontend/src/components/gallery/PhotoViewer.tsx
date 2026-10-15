import { useEffect, useRef, type KeyboardEvent, type TouchEvent } from 'react'
import { stepIndex, swipeStep, type ViewerPhoto } from '../../lib/gallery'
import { galleryImageSrc } from '../../services/gallery'

interface PhotoViewerProps {
  photos: ViewerPhoto[]
  index: number | null
  onIndexChange: (index: number) => void
  onClose: () => void
}

const STEP_BUTTON = 'inline-flex min-h-13 cursor-pointer items-center justify-center border-[1.5px] px-4 text-[0.9375rem] font-semibold desktop:min-h-12'

// A native <dialog>: the browser traps the focus, closes on Esc and gives the focus back to the photo that was touched.
export function PhotoViewer({ photos, index, onIndexChange, onClose }: PhotoViewerProps) {
  const dialog = useRef<HTMLDialogElement>(null)
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const open = index !== null
  const photo = index === null ? undefined : photos[index]
  const total = photos.length

  useEffect(() => {
    const element = dialog.current
    if (!element) return
    if (open && !element.open) element.showModal()
    else if (!open && element.open) element.close()
  }, [open])

  useEffect(() => {
    if (index === null) return
    for (const step of [1, -1]) {
      const neighbour = photos[stepIndex(index, step, total)]
      if (neighbour && typeof Image !== 'undefined') new Image().src = galleryImageSrc(neighbour.url)
    }
  }, [index, photos, total])

  function go(step: number) {
    if (index === null) return
    onIndexChange(stepIndex(index, step, total))
  }

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowRight') go(1)
    else if (event.key === 'ArrowLeft') go(-1)
    else return
    event.preventDefault()
  }

  function onTouchStart(event: TouchEvent) {
    const touch = event.touches[0]
    touchStart.current = touch ? { x: touch.clientX, y: touch.clientY } : null
  }

  function onTouchEnd(event: TouchEvent) {
    const start = touchStart.current
    const touch = event.changedTouches[0]
    touchStart.current = null
    if (!start || !touch) return
    const step = swipeStep(touch.clientX - start.x, touch.clientY - start.y)
    if (step !== 0) go(step)
  }

  return (
    <dialog
      ref={dialog}
      aria-label="Foto em tela cheia"
      onKeyDown={onKeyDown}
      onClose={onClose}
      className="m-0 h-dvh max-h-none w-full max-w-none flex-col border-0 bg-brown p-0 text-cream backdrop:bg-scrim open:flex desktop:m-auto desktop:h-fit desktop:max-h-[calc(100dvh-5rem)] desktop:w-[min(70rem,calc(100%-5rem))] desktop:grid-cols-[minmax(0,1fr)_20rem] desktop:border-[1.5px] desktop:border-brown desktop:bg-cream desktop:text-brown desktop:shadow-[8px_8px_0_var(--color-ochre)] desktop:open:grid"
    >
      {photo && (
        <>
          <figure
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            className="order-2 m-0 flex min-h-0 flex-1 items-center desktop:order-none desktop:min-h-[35rem] desktop:justify-center desktop:bg-cream-dark"
          >
            <img
              key={photo.id}
              src={galleryImageSrc(photo.url)}
              alt={photo.alt}
              className="block max-h-full w-full object-contain desktop:max-h-[40rem] desktop:w-auto desktop:max-w-full"
            />
          </figure>

          <div className="contents desktop:flex desktop:flex-col desktop:gap-3.5 desktop:border-l-[1.5px] desktop:border-brown desktop:p-6">
            <div className="order-1 flex h-17 flex-none items-center justify-between pt-3 pr-2 pl-4 desktop:order-none desktop:h-auto desktop:p-0">
              <span aria-live="polite" className="text-small font-semibold text-cream-dim desktop:text-brown-400">
                {(index ?? 0) + 1} de {total}
              </span>
              <button
                type="button"
                onClick={onClose}
                aria-label="Fechar"
                className="grid size-12 cursor-pointer place-items-center bg-transparent text-[1.875rem] leading-none text-cream desktop:size-11 desktop:rounded-control desktop:border-[1.5px] desktop:border-brown desktop:text-[1.625rem] desktop:text-brown"
              >
                <span aria-hidden="true">×</span>
              </button>
            </div>

            <div className="order-3 flex flex-none flex-col gap-2 px-4 pt-4 desktop:order-none desktop:gap-3.5 desktop:p-0">
              <p className="m-0 text-overline font-semibold tracking-[0.12em] text-ochre uppercase desktop:text-ochre-deep">{photo.album}</p>
              {photo.caption && <p className="m-0 text-body leading-normal desktop:text-[1.0625rem]">{photo.caption}</p>}
            </div>

            <div className="order-4 grid flex-none grid-cols-2 gap-2.5 px-4 pt-4.5 pb-7 desktop:order-none desktop:mt-auto desktop:p-0">
              <button type="button" onClick={() => go(-1)} className={`${STEP_BUTTON} border-cream bg-transparent text-cream desktop:border-brown desktop:text-brown`}>
                <span aria-hidden="true">←&nbsp;</span>Anterior
              </button>
              <button
                type="button"
                onClick={() => go(1)}
                className={`${STEP_BUTTON} border-cream bg-transparent text-cream desktop:border-brown desktop:bg-brown desktop:text-cream desktop:shadow-applique-ochre`}
              >
                Próxima<span aria-hidden="true">&nbsp;→</span>
              </button>
            </div>
            <p className="m-0 hidden text-[0.8125rem] text-brown-400 desktop:block">Setas do teclado também passam; Esc fecha.</p>
          </div>
        </>
      )}
    </dialog>
  )
}
