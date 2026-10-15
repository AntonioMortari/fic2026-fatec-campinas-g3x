import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { ADMIN_GALLERY_PATH } from '../../lib/gallery'
import { useAdminPhotoImage, useUpdatePhotoText } from '../../services/gallery'
import type { AdminPhoto } from '../../types/gallery'
import { useFormFeedback } from '../auth/use-form-feedback'
import { Alert, Button, Skeleton, TextAreaField, TextField } from '../ui'
import { BlobImage } from './BlobImage'

const FIELD_SUMMARIES: Record<string, string> = {
  album: 'Confira o álbum marcado abaixo.',
  alt: 'Confira a descrição marcada abaixo.',
  caption: 'Confira a legenda marcada abaixo.',
}

// On the phone it is a screen of its own and leaves when saved; on the desktop it is the right column, stays open and says it was saved.
export function PhotoEditForm({ photo, desktop, onSaved }: { photo: AdminPhoto; desktop: boolean; onSaved: () => void }) {
  const save = useUpdatePhotoText()
  const image = useAdminPhotoImage(photo.imageUrl)
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const [album, setAlbum] = useState(photo.album)
  const [alt, setAlt] = useState(photo.alt)
  const [caption, setCaption] = useState(photo.caption ?? '')
  const [local, setLocal] = useState<Record<string, string>>({})

  const fields = { ...feedback.fields, ...local }
  const invalid = Object.keys(fields)
  const summary =
    invalid.length === 1 ? (FIELD_SUMMARIES[invalid[0]!] ?? 'Confira o campo marcado abaixo.') : invalid.length > 1 ? 'Confira os campos marcados abaixo.' : feedback.error?.message

  function change(field: string, set: (value: string) => void, value: string) {
    set(value)
    setLocal(({ [field]: _cleared, ...rest }) => rest)
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    const missing: Record<string, string> = {}
    if (!album.trim()) missing.album = 'Escreva o nome do álbum.'
    if (!alt.trim()) missing.alt = 'Descreva a foto para quem não a enxerga.'
    setLocal(missing)
    if (Object.keys(missing).length > 0) {
      feedback.fail(new Error('invalid'))
      return
    }
    try {
      await save.mutateAsync({ id: photo.id, album, alt, caption })
      onSaved()
    } catch (error) {
      feedback.fail(error)
    }
  }

  const Heading = desktop ? 'h2' : 'h1'

  return (
    <div className="flex max-w-xl flex-col gap-4">
      <Heading className={desktop ? 'm-0 text-[1.5rem] leading-[1.2] font-bold' : 'm-0 text-[1.75rem] leading-[1.15] font-bold'}>Corrigir o texto da foto</Heading>
      {image.data ? (
        <BlobImage blob={image.data} className="block aspect-[4/3] w-full object-cover" />
      ) : image.isError ? null : (
        <Skeleton className="aspect-[4/3] w-full" />
      )}
      <p className="m-0 border border-line bg-card px-3.5 py-3 text-[0.90625rem] leading-normal">
        A foto e a autorização de imagem não mudam por aqui — só o texto.
        {photo.state === 'live' && ' Esta foto está no ar: o texto novo aparece no site na hora.'}
      </p>

      <form ref={formRef} onSubmit={(event) => void submit(event)} noValidate className="flex flex-col gap-4">
        {(feedback.error || invalid.length > 0) && (
          <Alert ref={alertRef} tone="error">
            {summary}
          </Alert>
        )}
        <TextField
          label="Álbum"
          name="album"
          maxLength={120}
          value={album}
          onChange={(event) => change('album', setAlbum, event.target.value)}
          hint="Fotos com o mesmo nome de álbum aparecem juntas na galeria do site."
          error={fields.album}
        />
        <TextAreaField
          label="Descrição da foto"
          name="alt"
          rows={3}
          maxLength={300}
          value={alt}
          onChange={(event) => change('alt', setAlt, event.target.value)}
          className="[&_textarea]:min-h-20 desktop:[&_textarea]:min-h-18"
          hint="Para quem não pode ver a foto. Não é a legenda: é a descrição."
          error={fields.alt}
        />
        <TextField
          label="Legenda"
          labelNote="opcional"
          name="caption"
          maxLength={300}
          value={caption}
          onChange={(event) => change('caption', setCaption, event.target.value)}
          error={fields.caption}
        />
        <Button type="submit" variant="applique" loading={save.isPending} className="min-h-13 w-full text-[1rem]">
          Salvar texto
        </Button>
        {desktop ? (
          <Link to={ADMIN_GALLERY_PATH} className="inline-flex min-h-11 items-center justify-center text-[0.9375rem] font-semibold">
            Cancelar
          </Link>
        ) : (
          <Button to={ADMIN_GALLERY_PATH} variant="secondary" className="min-h-13 text-[1rem]">
            Voltar sem salvar
          </Button>
        )}
      </form>
    </div>
  )
}
