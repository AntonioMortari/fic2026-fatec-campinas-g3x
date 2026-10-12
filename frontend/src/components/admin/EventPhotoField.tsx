import { useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { PHOTO_HELP, PHOTO_TYPES, PhotoRejected, preparePhoto, type PhotoDraft, EMPTY_PHOTO, AUTHORIZATION_TEXT } from '../../lib/photo-file'
import { useAdminEventPhoto } from '../../services/admin-events'
import type { AdminEvent } from '../../types/admin-event'
import { Checkbox, FieldMessages, TextField } from '../ui'

function useObjectUrl(blob: Blob | null | undefined): string | null {
  const url = useMemo(() => (blob && typeof URL.createObjectURL === 'function' ? URL.createObjectURL(blob) : null), [blob])
  useEffect(() => () => {
    if (url) URL.revokeObjectURL(url)
  }, [url])
  return url
}

interface EventPhotoFieldProps {
  event?: AdminEvent
  draft: PhotoDraft
  onChange: (draft: PhotoDraft) => void
  errors: { data?: string; alt?: string; authorized?: string }
}

export function EventPhotoField({ event, draft, onChange, errors }: EventPhotoFieldProps) {
  const [fileError, setFileError] = useState<string | undefined>()
  const stored = event?.image ?? null
  const storedBlob = useAdminEventPhoto(draft.removed ? undefined : stored?.url).data
  const storedUrl = useObjectUrl(storedBlob)
  const chosenUrl = useObjectUrl(draft.blob)
  const keeping = Boolean(stored) && !draft.removed
  const previewUrl = chosenUrl ?? (keeping ? storedUrl : null)
  const hasPhoto = Boolean(draft.blob) || keeping

  async function choose(change: ChangeEvent<HTMLInputElement>) {
    const file = change.target.files?.[0]
    change.target.value = ''
    if (!file) return
    try {
      const blob = await preparePhoto(file)
      setFileError(undefined)
      onChange({ ...draft, blob, removed: false })
    } catch (error) {
      setFileError(error instanceof PhotoRejected ? error.message : 'Não foi possível ler essa foto. Escolha outra.')
    }
  }

  return (
    <section aria-labelledby="photo-title" className="flex flex-col gap-2.5 border-t-[1.5px] border-brown pt-4 desktop:gap-3">
      <h3 id="photo-title" className="m-0 text-[1.25rem] leading-[1.2] font-bold">
        Foto do evento <span className="text-[0.9375rem] font-normal text-brown-400">opcional</span>
      </h3>

      <div className="grid grid-cols-[8.75rem_minmax(0,1fr)] items-start gap-4 max-[24rem]:grid-cols-1">
        {previewUrl && <img src={previewUrl} alt="" className="block h-[6.5625rem] w-35 object-cover" />}
        <div className="flex flex-col items-start gap-1.5">
          <label className="inline-flex min-h-11 cursor-pointer items-center border-[1.5px] border-brown px-3.5 text-[0.90625rem] font-semibold has-[:focus-visible]:shadow-focus hover:bg-hover">
            <input type="file" accept={PHOTO_TYPES.join(',')} onChange={(change) => void choose(change)} className="sr-only" />
            {hasPhoto ? 'Trocar foto' : 'Escolher foto'}
          </label>
          <p className="m-0 text-[0.8125rem] leading-[1.45] text-brown-400">{PHOTO_HELP}</p>
          <FieldMessages error={fileError ?? errors.data} />
        </div>
      </div>

      {draft.blob && (
        <>
          <TextField
            label="Descrição da foto"
            name="photoAlt"
            hint="Obrigatória quando há foto — o banco recusa sem ela."
            value={draft.alt}
            onChange={(change) => onChange({ ...draft, alt: change.target.value })}
            error={errors.alt}
          />
          <div className="border-[1.5px] border-brown bg-card px-3.5 py-1">
            <Checkbox
              label={AUTHORIZATION_TEXT}
              name="photoAuthorized"
              checked={draft.authorized}
              onChange={(change) => onChange({ ...draft, authorized: change.target.checked })}
              error={errors.authorized}
              className="[&_label]:text-[0.90625rem] [&_label]:leading-[1.45]"
            />
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...EMPTY_PHOTO })}
            className="min-h-11 cursor-pointer self-start bg-transparent px-1 text-[0.90625rem] font-semibold text-blue-deep hover:text-brown"
          >
            Não trocar a foto
          </button>
        </>
      )}

      {!draft.blob && keeping && stored && (
        <>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[0.9375rem] font-semibold">Descrição da foto</p>
            <p className="m-0 text-body">{stored.alt}</p>
            <p className="m-0 text-[0.8125rem] leading-[1.45] text-brown-400">Para mudar a descrição, troque a foto.</p>
          </div>
          <button
            type="button"
            onClick={() => onChange({ ...draft, removed: true })}
            className="min-h-11 cursor-pointer self-start bg-transparent px-1 text-[0.90625rem] font-semibold text-blue-deep hover:text-brown"
          >
            Remover foto
          </button>
        </>
      )}

      {!draft.blob && draft.removed && (
        <p role="status" className="m-0 flex flex-wrap items-center gap-x-3 text-[0.9375rem]">
          A foto sai do evento quando você salvar.
          <button
            type="button"
            onClick={() => onChange({ ...draft, removed: false })}
            className="min-h-11 cursor-pointer bg-transparent px-1 text-[0.90625rem] font-semibold text-blue-deep hover:text-brown"
          >
            Desfazer
          </button>
        </p>
      )}
    </section>
  )
}
