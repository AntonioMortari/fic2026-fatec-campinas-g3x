import { useState, type ChangeEvent, type FormEvent } from 'react'
import { cn } from '../../lib/cn'
import {
  AUTHORIZATION_DECLARATION,
  AUTHORIZATION_HELP,
  fileSize,
  NO_PHOTO_CHOSEN,
  PHOTO_HELP,
  type NoticeKey,
} from '../../lib/gallery'
import { PHOTO_TYPES, PhotoRejected, preparePhoto, toBase64 } from '../../lib/photo-file'
import { DESKTOP_QUERY, useMediaQuery } from '../../lib/use-media-query'
import { useUploadPhoto } from '../../services/gallery'
import { useFormFeedback } from '../auth/use-form-feedback'
import { ActionBar, Alert, Button, FieldMessages, TextAreaField, TextField } from '../ui'

interface Chosen {
  blob: Blob
  name: string
  reduced: boolean
}

const FIELD_SUMMARIES: Record<string, string> = {
  data: 'Confira a foto marcada abaixo.',
  album: 'Confira o álbum marcado abaixo.',
  alt: 'Confira a descrição marcada abaixo.',
  caption: 'Confira a legenda marcada abaixo.',
}

export function PhotoUploadForm({ onStart, onUploaded }: { onStart: () => void; onUploaded: (notice: NoticeKey) => void }) {
  const desktop = useMediaQuery(DESKTOP_QUERY)
  const upload = useUploadPhoto()
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const [chosen, setChosen] = useState<Chosen | null>(null)
  const [album, setAlbum] = useState('')
  const [alt, setAlt] = useState('')
  const [caption, setCaption] = useState('')
  const [authorized, setAuthorized] = useState(false)
  const [local, setLocal] = useState<Record<string, string>>({})
  const [fileError, setFileError] = useState<string | undefined>()
  const [inputKey, setInputKey] = useState(0)
  const [preparing, setPreparing] = useState(false)

  const fields = { ...feedback.fields, ...local }
  const invalid = Object.keys(fields)
  const summary =
    invalid.length === 1 ? (FIELD_SUMMARIES[invalid[0]!] ?? 'Confira o campo marcado abaixo.') : invalid.length > 1 ? 'Confira os campos marcados abaixo.' : feedback.error?.message

  async function choose(change: ChangeEvent<HTMLInputElement>) {
    const file = change.target.files?.[0]
    if (!file) return
    setPreparing(true)
    try {
      const blob = await preparePhoto(file)
      setFileError(undefined)
      setLocal(({ data: _data, ...rest }) => rest)
      setChosen({ blob, name: file.name, reduced: blob !== file })
    } catch (error) {
      setChosen(null)
      setFileError(error instanceof PhotoRejected ? error.message : 'Não foi possível ler essa foto. Escolha outra.')
    } finally {
      setPreparing(false)
    }
  }

  function reset() {
    setChosen(null)
    setAlbum('')
    setAlt('')
    setCaption('')
    setAuthorized(false)
    setLocal({})
    setFileError(undefined)
    setInputKey((key) => key + 1)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    const missing: Record<string, string> = {}
    if (!chosen) missing.data = fileError ?? NO_PHOTO_CHOSEN
    if (!album.trim()) missing.album = 'Escreva o nome do álbum.'
    if (!alt.trim()) missing.alt = 'Descreva a foto para quem não a enxerga.'
    setLocal(missing)
    if (Object.keys(missing).length > 0 || !chosen) {
      feedback.fail(new Error('invalid'))
      return
    }
    onStart()
    try {
      const data = await toBase64(chosen.blob)
      await upload.mutateAsync({ data, album, alt, caption, authorized })
      onUploaded(authorized ? 'kept' : 'kept_unauthorized')
      reset()
    } catch (error) {
      feedback.fail(error)
    }
  }

  const fileMessage = fields.data ?? fileError

  return (
    <form ref={formRef} onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
      {(feedback.error || invalid.length > 0) && (
        <Alert ref={alertRef} tone="error">
          {summary}
        </Alert>
      )}

      <div className="flex flex-col gap-1.5">
        <span id="photo-file-label" className="text-[0.9375rem] leading-[1.2] font-semibold">
          Foto
        </span>
        <label
          className={cn(
            'flex min-h-14 cursor-pointer items-center justify-center gap-3 border-[1.5px] border-dashed text-[0.9375rem] font-semibold has-[:focus-visible]:shadow-focus hover:bg-hover',
            'desktop:justify-start desktop:border-brown/50 desktop:bg-card desktop:px-3 desktop:text-small',
            fileMessage ? 'border-error' : 'border-brown',
          )}
        >
          <input
            key={inputKey}
            type="file"
            name="photo"
            accept={PHOTO_TYPES.join(',')}
            aria-labelledby="photo-file-label"
            aria-invalid={fileMessage ? true : undefined}
            onChange={(change) => void choose(change)}
            className="sr-only"
          />
          <span className="desktop:flex desktop:min-h-10 desktop:items-center desktop:border-[1.5px] desktop:border-brown desktop:px-3">
            {chosen ? 'Trocar foto' : 'Escolher foto'}
          </span>
          {chosen && <span className="hidden min-w-0 truncate font-normal text-brown-600 desktop:inline">{chosen.name}</span>}
        </label>
        {preparing && (
          <p role="status" className="m-0 text-[0.84375rem] font-semibold">
            Preparando a foto…
          </p>
        )}
        {chosen && !preparing && (
          <p role="status" className="m-0 text-[0.84375rem] leading-[1.45] font-semibold">
            Escolhida: {chosen.name} — {fileSize(chosen.blob.size)}.{chosen.reduced && ' Reduzida para caber no limite.'}
          </p>
        )}
        <FieldMessages error={fileMessage} hint={PHOTO_HELP} />
      </div>

      <TextField
        label="Álbum"
        name="album"
        maxLength={120}
        value={album}
        onChange={(change) => setAlbum(change.target.value)}
        hint={desktop ? 'O nome da oficina, do evento ou do projeto. Fotos com o mesmo nome de álbum aparecem juntas na galeria do site.' : 'Fotos com o mesmo nome de álbum aparecem juntas na galeria do site.'}
        error={fields.album}
      />

      <TextAreaField
        label="Descrição da foto"
        name="alt"
        rows={3}
        maxLength={300}
        value={alt}
        onChange={(change) => setAlt(change.target.value)}
        className="[&_textarea]:min-h-20 desktop:[&_textarea]:min-h-18"
        hint={
          desktop
            ? 'Para quem não pode ver a foto. Diga o que aparece nela — “crianças tocando tambor numa roda”, por exemplo. Não é a legenda: é a descrição.'
            : 'Para quem não pode ver a foto. Não é a legenda: é a descrição.'
        }
        error={fields.alt}
      />

      <TextField label="Legenda" labelNote="opcional" name="caption" maxLength={300} value={caption} onChange={(change) => setCaption(change.target.value)} error={fields.caption} />

      <label
        className={cn(
          'grid cursor-pointer grid-cols-[1.625rem_minmax(0,1fr)] items-start gap-3 border-[1.5px] p-3.5 has-[:focus-visible]:shadow-focus',
          authorized ? 'border-brown bg-card' : 'border-brown/40 bg-transparent',
        )}
      >
        <input type="checkbox" name="authorized" checked={authorized} onChange={(change) => setAuthorized(change.target.checked)} className="peer sr-only" />
        <span
          aria-hidden="true"
          className="grid size-6.5 place-items-center rounded-xs border-[1.5px] border-brown bg-card peer-checked:bg-brown [&>span]:opacity-0 peer-checked:[&>span]:opacity-100"
        >
          <span className="h-3 w-1.75 translate-x-px -translate-y-px rotate-45 border-r-[2.5px] border-b-[2.5px] border-cream" />
        </span>
        <span className="flex flex-col gap-1.5">
          <span className="text-[0.90625rem] leading-[1.45] font-semibold">{AUTHORIZATION_DECLARATION}</span>
          <span className={cn('text-[0.8125rem] leading-[1.45]', authorized ? 'text-brown-400' : 'font-semibold text-ochre-deep')}>
            {authorized ? AUTHORIZATION_HELP.declared : AUTHORIZATION_HELP.missing}
          </span>
        </span>
      </label>

      <ActionBar
        primary={
          <Button type="submit" variant="applique" loading={upload.isPending || preparing} className="min-h-13 w-full text-[1rem]">
            {authorized ? 'Subir foto' : 'Subir e guardar sem publicar'}
          </Button>
        }
      />
    </form>
  )
}
