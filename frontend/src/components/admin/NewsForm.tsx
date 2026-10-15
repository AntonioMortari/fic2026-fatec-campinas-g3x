import { useState, type FormEvent } from 'react'
import { useFormFeedback } from '../auth/use-form-feedback'
import { parseApiError } from '../../lib/api-error'
import { longDate, numericDate } from '../../lib/news'
import { EMPTY_PHOTO, type PhotoDraft } from '../../lib/photo-file'
import type { AdminNews, NewsInput } from '../../types/admin-news'
import type { NewsKind } from '../../types/news'
import { ActionBar, Alert, Button, SegmentedField, TextAreaField, TextField } from '../ui'
import { NewsImageField } from './NewsImageField'

export type ImageChange = { kind: 'upload'; blob: Blob; alt: string } | { kind: 'remove' } | null

interface NewsFormProps {
  news?: AdminNews
  saving: boolean
  notice?: string
  onSubmit: (input: NewsInput, image: ImageChange, onError: (error: unknown) => void) => void
}

const KINDS = [
  { value: 'news', label: 'Notícia' },
  { value: 'campaign', label: 'Campanha' },
] as const

function stateLine(news?: AdminNews): string {
  if (!news) return 'Nova'
  return news.published && news.publishedAt
    ? `No ar · publicada em ${longDate(news.publishedAt)}`
    : `Rascunho · escrita em ${numericDate(news.createdAt)}`
}

function footerLine(news?: AdminNews): string {
  if (!news) return 'Nasce como rascunho.'
  return news.published ? 'Já está no ar: a correção aparece no site ao guardar.' : 'Continua rascunho depois de guardar.'
}

export function NewsForm({ news, saving, notice, onSubmit }: NewsFormProps) {
  const [kind, setKind] = useState<NewsKind>(news?.kind ?? 'news')
  const [title, setTitle] = useState(news?.title ?? '')
  const [summary, setSummary] = useState(news?.summary ?? '')
  const [body, setBody] = useState(news?.body ?? '')
  const [draft, setDraft] = useState<PhotoDraft>(EMPTY_PHOTO)
  const [localError, setLocalError] = useState<{ alt?: string; authorized?: string }>({})
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const hasFieldErrors = Object.keys(feedback.fields).length > 0 || Object.keys(localError).length > 0
  const saveLabel = news ? 'Guardar alterações' : 'Guardar rascunho'

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    const missing: { alt?: string; authorized?: string } = {}
    if (draft.blob && !draft.alt.trim()) missing.alt = 'Descreva a imagem para quem não a enxerga.'
    if (draft.blob && !draft.authorized) missing.authorized = 'Para subir a imagem, confirme que existe autorização de uso de imagem.'
    setLocalError(missing)
    if (Object.keys(missing).length > 0) return

    const image: ImageChange = draft.blob ? { kind: 'upload', blob: draft.blob, alt: draft.alt.trim() } : draft.removed ? { kind: 'remove' } : null
    onSubmit({ kind, title, summary, body }, image, (error) => {
      const fields = parseApiError(error).fields
      setLocalError({ alt: fields.alt, authorized: fields.authorized })
      feedback.fail(error)
    })
  }

  const errors = { data: feedback.fields.data, alt: localError.alt ?? feedback.fields.alt, authorized: localError.authorized ?? feedback.fields.authorized }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-32 desktop:overflow-y-auto desktop:px-8 desktop:py-7 desktop:pb-7">
        <div className="flex flex-col gap-1.5">
          <span className="hidden text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep desktop:block">{stateLine(news)}</span>
          <h1 className="m-0 text-[1.75rem] leading-[1.15] font-bold desktop:text-[1.625rem]">{news ? 'Editar notícia' : 'Escrever notícia'}</h1>
          <p className="m-0 text-[0.9375rem] leading-normal text-brown-600 desktop:text-[0.90625rem]">
            Guardar não coloca no ar. A notícia fica como rascunho e vai para o site quando você apertar “Publicar” na lista.
          </p>
        </div>

        {notice && <Alert tone="error">{notice}</Alert>}
        {feedback.error && (
          <Alert ref={alertRef} tone="error">
            {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
          </Alert>
        )}

        <SegmentedField legend="Tipo" hideLegend name="kind" options={[...KINDS]} value={kind} onChange={setKind} error={feedback.fields.kind} />
        <TextField label="Título" name="title" required hint="Aparece na lista e no topo da notícia." value={title} onChange={(e) => setTitle(e.target.value)} error={feedback.fields.title} />
        <TextAreaField
          label={
            <>
              Resumo <span className="font-normal text-brown-400">opcional</span>
            </>
          }
          name="summary"
          rows={3}
          hint="Uma ou duas frases para dar a ideia geral."
          value={summary}
          onChange={(e) => setSummary(e.target.value)}
          error={feedback.fields.summary}
        />
        <TextAreaField
          label="Texto da notícia"
          name="body"
          rows={8}
          hint="Deixe uma linha em branco entre um parágrafo e outro."
          value={body}
          onChange={(e) => setBody(e.target.value)}
          error={feedback.fields.body}
        />
        <NewsImageField news={news} draft={draft} onChange={setDraft} errors={errors} />
      </div>

      <div className="hidden items-center justify-between gap-2.5 border-t border-line bg-cream px-8 py-4 desktop:flex">
        <span className="text-[0.84375rem] text-brown-400">{footerLine(news)}</span>
        <Button type="submit" variant="applique" className="min-h-12 px-5.5 text-[0.9375rem]" loading={saving}>
          {saveLabel}
        </Button>
      </div>
      <div className="desktop:hidden">
        <ActionBar
          wrap
          primary={
            <Button type="submit" variant="applique" fullWidth className="min-h-13 text-[1rem]" loading={saving}>
              {saveLabel}
            </Button>
          }
        />
      </div>
    </form>
  )
}
