import { useState, type ChangeEvent } from 'react'
import { PHOTO_TYPES, PhotoRejected, preparePhoto, EMPTY_PHOTO, AUTHORIZATION_TEXT, type PhotoDraft } from '../../lib/photo-file'
import { useAdminNewsImage } from '../../services/admin-news'
import type { AdminNews } from '../../types/admin-news'
import { Checkbox, FieldMessages, TextField } from '../ui'
import { useObjectUrl } from './use-object-url'

const TEXT_BUTTON = 'min-h-11 cursor-pointer self-start bg-transparent px-1 text-[0.90625rem] font-semibold text-blue-deep hover:text-brown'

interface NewsImageFieldProps {
  news?: AdminNews
  draft: PhotoDraft
  onChange: (draft: PhotoDraft) => void
  errors: { data?: string; alt?: string; authorized?: string }
}

export function NewsImageField({ news, draft, onChange, errors }: NewsImageFieldProps) {
  const [fileError, setFileError] = useState<string | undefined>()
  const stored = news?.image ?? null
  const storedUrl = useObjectUrl(useAdminNewsImage(draft.removed ? undefined : stored?.url).data)
  const chosenUrl = useObjectUrl(draft.blob)
  const keeping = Boolean(stored) && !draft.removed
  const preview = chosenUrl ?? (keeping ? storedUrl : null)
  const hasImage = Boolean(draft.blob) || keeping

  async function choose(change: ChangeEvent<HTMLInputElement>) {
    const file = change.target.files?.[0]
    change.target.value = ''
    if (!file) return
    try {
      const blob = await preparePhoto(file)
      setFileError(undefined)
      onChange({ ...draft, blob, removed: false })
    } catch (error) {
      setFileError(error instanceof PhotoRejected ? error.message : 'Não foi possível ler essa imagem. Escolha outra.')
    }
  }

  return (
    <section aria-labelledby="news-image-title" className="flex flex-col gap-3">
      <div className="grid grid-cols-1 items-start gap-1.5 desktop:grid-cols-[7.5rem_minmax(0,1fr)] desktop:gap-3.5">
        {preview ? (
          <img src={preview} alt="" className="block h-22.5 w-30 object-cover" />
        ) : (
          <span className="hidden h-22.5 w-30 place-items-center border-[1.5px] border-dashed border-brown/50 text-[0.75rem] font-semibold text-brown-400 desktop:grid">sem imagem</span>
        )}
        <div className="flex flex-col gap-1.5">
          <span id="news-image-title" className="text-[0.9375rem] font-semibold">
            Imagem <span className="font-normal text-brown-400">opcional</span>
          </span>
          <label className="flex min-h-13 cursor-pointer items-center justify-center border-[1.5px] border-dashed border-brown text-[0.9375rem] font-semibold has-[:focus-visible]:shadow-focus hover:bg-hover desktop:inline-flex desktop:min-h-11 desktop:self-start desktop:border-solid desktop:px-3 desktop:text-small">
            <input type="file" accept={PHOTO_TYPES.join(',')} onChange={(change) => void choose(change)} className="sr-only" />
            {hasImage ? 'Trocar imagem' : 'Escolher imagem'}
          </label>
          <p className="m-0 text-[0.8125rem] leading-[1.45] text-brown-400">
            {hasImage ? 'Escolher outra substitui a atual; deixar como está mantém a que está lá.' : 'JPG, PNG, GIF ou WebP, até 4 MB.'}
          </p>
          <FieldMessages error={fileError ?? errors.data} />
        </div>
      </div>

      {draft.blob && (
        <>
          <TextField
            label="Descrição da imagem"
            name="imageAlt"
            hint="Obrigatória quando há imagem — como “crianças em roda ouvindo uma história”."
            value={draft.alt}
            onChange={(change) => onChange({ ...draft, alt: change.target.value })}
            error={errors.alt}
          />
          <div className="border-[1.5px] border-brown bg-card px-3.5 py-1">
            <Checkbox
              label={AUTHORIZATION_TEXT}
              name="imageAuthorized"
              checked={draft.authorized}
              onChange={(change) => onChange({ ...draft, authorized: change.target.checked })}
              error={errors.authorized}
              className="[&_label]:text-[0.90625rem] [&_label]:leading-[1.45]"
            />
          </div>
          <button type="button" onClick={() => onChange({ ...EMPTY_PHOTO })} className={TEXT_BUTTON}>
            Não trocar a imagem
          </button>
        </>
      )}

      {!draft.blob && keeping && stored && (
        <>
          <div className="flex flex-col gap-1">
            <p className="m-0 text-[0.9375rem] font-semibold">Descrição da imagem</p>
            <p className="m-0 text-body">{stored.alt}</p>
            <p className="m-0 text-[0.8125rem] leading-[1.45] text-brown-400">Para mudar a descrição, troque a imagem.</p>
          </div>
          <button type="button" onClick={() => onChange({ ...draft, removed: true })} className={TEXT_BUTTON}>
            Remover imagem
          </button>
        </>
      )}

      {!draft.blob && draft.removed && (
        <p role="status" className="m-0 flex flex-wrap items-center gap-x-3 text-[0.9375rem]">
          A imagem sai da notícia quando você guardar.
          <button type="button" onClick={() => onChange({ ...draft, removed: false })} className={TEXT_BUTTON}>
            Desfazer
          </button>
        </p>
      )}
    </section>
  )
}
