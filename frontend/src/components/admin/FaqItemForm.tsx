import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useFormFeedback } from '../auth/use-form-feedback'
import { ADMIN_FAQ_PATH } from '../../lib/faq'
import type { AdminFaq, AdminFaqItem, FaqItemInput } from '../../types/faq'
import { ActionBar, Alert, Button, SelectField, TextAreaField, TextField } from '../ui'

export const NEW_THEME = '__new__'

export interface FaqSubmit {
  input: FaqItemInput
  newThemeName: string | null
}

interface FaqItemFormProps {
  data: AdminFaq
  item?: AdminFaqItem
  saving: boolean
  toggling: boolean
  onSubmit: (submit: FaqSubmit, onError: (error: unknown) => void) => void
  onTogglePublication: () => void
}

export function FaqItemForm({ data, item, saving, toggling, onSubmit, onTogglePublication }: FaqItemFormProps) {
  const [question, setQuestion] = useState(item?.question ?? '')
  const [answer, setAnswer] = useState(item?.answer ?? '')
  const [themeId, setThemeId] = useState(item?.themeId ?? '')
  const [newTheme, setNewTheme] = useState('')
  const [linkTo, setLinkTo] = useState(item?.linkTo ?? '')
  const [source, setSource] = useState(item?.source ?? '')
  const [localError, setLocalError] = useState<Record<string, string>>({})
  const { formRef, alertRef, ...feedback } = useFormFeedback()
  const errors = { ...feedback.fields, ...localError }
  const hasFieldErrors = Object.keys(errors).length > 0
  const themeName = data.themes.find((theme) => theme.id === item?.themeId)?.name

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    feedback.clear()
    const missing: Record<string, string> = {}
    if (themeId === NEW_THEME && !newTheme.trim()) missing.newTheme = 'Escreva o nome do novo tema.'
    else if (!themeId) missing.themeId = 'Escolha um tema.'
    if (!source) missing.source = 'Diga em que página do site esta resposta já está escrita.'
    setLocalError(missing)
    if (Object.keys(missing).length > 0) return
    onSubmit(
      { input: { question, answer, themeId: themeId === NEW_THEME ? '' : themeId, linkTo: linkTo || null, source }, newThemeName: themeId === NEW_THEME ? newTheme.trim() : null },
      (error) => {
        feedback.fail(error)
      },
    )
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} noValidate className="flex min-h-full flex-1 flex-col">
      <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-40 desktop:overflow-y-auto desktop:px-8 desktop:py-7 desktop:pb-7">
        <div className="flex flex-col gap-1.5">
          <span className="text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">
            {item ? `${item.published ? 'No ar' : 'Fora do ar'}${themeName ? ` · ${themeName}` : ''}` : 'Nova · fica fora do ar até você publicar'}
          </span>
          <h1 className="m-0 text-[1.75rem] leading-[1.15] font-bold desktop:text-[1.625rem]">{item ? 'Corrigir pergunta' : 'Nova pergunta'}</h1>
        </div>

        {feedback.error && (
          <Alert ref={alertRef} tone="error">
            {hasFieldErrors ? 'Confira os campos destacados abaixo.' : feedback.error.message}
          </Alert>
        )}

        <TextField label="Pergunta" name="question" required hint="Como a pessoa perguntaria, com ponto de interrogação." value={question} onChange={(e) => setQuestion(e.target.value)} error={errors.question} />
        <TextAreaField label="Resposta" name="answer" rows={7} value={answer} onChange={(e) => setAnswer(e.target.value)} error={errors.answer} />

        <div className="flex flex-col gap-2">
          <SelectField
            label="Tema"
            name="themeId"
            placeholder="Escolha um tema"
            options={[...data.themes.map((theme) => ({ value: theme.id, label: theme.name })), { value: NEW_THEME, label: '+ Novo tema…' }]}
            value={themeId}
            onChange={(e) => setThemeId(e.target.value)}
            error={errors.themeId}
          />
          {themeId === NEW_THEME && (
            <TextField label="Nome do novo tema" name="newTheme" maxLength={40} value={newTheme} onChange={(e) => setNewTheme(e.target.value)} error={errors.newTheme ?? errors.name} />
          )}
          <Link to={`${ADMIN_FAQ_PATH}/temas`} className="hidden min-h-11 items-center self-start text-[0.9375rem] font-semibold desktop:inline-flex">
            + Criar ou organizar temas
          </Link>
        </div>

        <SelectField
          label="Link no fim (opcional)"
          name="linkTo"
          placeholder="Nenhum"
          options={data.options.links.map((link) => ({ value: link.to, label: link.label }))}
          value={linkTo}
          onChange={(e) => setLinkTo(e.target.value)}
          error={errors.linkTo}
        />
        <SelectField
          label="Onde esta resposta já está escrita no site (obrigatório)"
          name="source"
          placeholder="Escolha a página"
          options={data.options.sources.map((entry) => ({ value: entry.id, label: entry.label }))}
          value={source}
          onChange={(e) => setSource(e.target.value)}
          hint="A pergunta frequente repete o que já está numa página, nunca uma informação nova. Se a página mudar, confira aqui também."
          error={errors.source}
        />
      </div>

      <div className="hidden items-center justify-between gap-2.5 border-t border-line bg-cream px-8 py-4 desktop:flex">
        {item ? (
          <Button type="button" variant="secondary" className="min-h-12 px-5 text-[0.9375rem]" loading={toggling} onClick={onTogglePublication}>
            {item.published ? 'Tirar do ar' : 'Pôr no ar'}
          </Button>
        ) : (
          <span className="text-[0.84375rem] text-brown-400">Nasce fora do ar.</span>
        )}
        <Button type="submit" variant="applique" className="min-h-12 px-5.5 text-[0.9375rem]" loading={saving}>
          Guardar
        </Button>
      </div>
      <div className="desktop:hidden">
        <ActionBar
          wrap
          primary={
            <Button type="submit" variant="applique" fullWidth className="min-h-13 text-[1rem]" loading={saving}>
              Guardar
            </Button>
          }
          secondary={
            item ? (
              <Button type="button" variant="secondary" fullWidth className="min-h-13 text-[1rem]" loading={toggling} onClick={onTogglePublication}>
                {item.published ? 'Tirar do ar' : 'Pôr no ar'}
              </Button>
            ) : undefined
          }
        />
      </div>
    </form>
  )
}
