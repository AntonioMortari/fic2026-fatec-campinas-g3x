import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { parseApiError } from '../../lib/api-error'
import { ADMIN_FAQ_PATH } from '../../lib/faq'
import type { AdminFaq } from '../../types/faq'
import { Alert, Button, TextField, useToast } from '../ui'
import {
  useCreateFaqTheme,
  useMoveFaqTheme,
  useRenameFaqTheme,
  useSetFaqThemePublication,
} from '../../services/admin-faq'

const ARROW = 'grid size-11 cursor-pointer place-items-center border-[1.5px] border-brown bg-transparent text-base font-bold text-brown disabled:cursor-not-allowed disabled:opacity-30'

function counting(total: number, onAir: number): string {
  if (total === 0) return 'nenhuma pergunta · não aparece no site'
  return `${total} ${total === 1 ? 'pergunta' : 'perguntas'}${onAir === 0 ? ' · nenhuma no ar' : ''}`
}

// Design 18d, "Temas": create, rename and reorder; there is no delete, taking a theme down hides all its questions and putting it back brings them all.
export function FaqThemesPanel({ data }: { data: AdminFaq }) {
  const toast = useToast()
  const create = useCreateFaqTheme()
  const rename = useRenameFaqTheme()
  const publication = useSetFaqThemePublication()
  const move = useMoveFaqTheme()
  const [newName, setNewName] = useState('')
  const [editing, setEditing] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [problem, setProblem] = useState<string | null>(null)
  const busy = move.isPending || publication.isPending

  const fail = (error: unknown) => setProblem(parseApiError(error).message)

  function add(event: FormEvent) {
    event.preventDefault()
    setProblem(null)
    if (!newName.trim()) return
    create.mutate(newName, {
      onSuccess: () => {
        setNewName('')
        toast('Tema criado. Ele só aparece na página pública quando tiver uma pergunta no ar.')
      },
      onError: fail,
    })
  }

  function save(event: FormEvent, id: string) {
    event.preventDefault()
    setProblem(null)
    if (!editName.trim()) return
    rename.mutate(
      { id, name: editName },
      {
        onSuccess: () => {
          setEditing(null)
          toast('Tema renomeado. O novo nome já vale na página pública.')
        },
        onError: fail,
      },
    )
  }

  function toggle(id: string, published: boolean, total: number, onAir: number) {
    setProblem(null)
    publication.mutate(
      { id, published: !published },
      {
        onSuccess: () =>
          toast(
            published
              ? `Tema tirado do ar. ${total ? `As ${total} perguntas dele saíram do site e continuam guardadas aqui.` : ''}`.trim()
              : `Tema de volta no ar${onAir ? `, com ${onAir} ${onAir === 1 ? 'pergunta' : 'perguntas'}` : ''}.`,
          ),
        onError: fail,
      },
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-4 px-4 pt-5 pb-8 desktop:overflow-y-auto desktop:px-8 desktop:py-7">
      <div className="flex items-start justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <span className="text-overline font-semibold uppercase tracking-[0.12em] text-ochre-deep">Organizar</span>
          <h1 className="m-0 text-[1.75rem] leading-[1.15] font-bold desktop:text-[1.625rem]">Temas</h1>
        </div>
        <Link to={ADMIN_FAQ_PATH} className="inline-flex min-h-11 items-center border-[1.5px] border-brown px-4 text-[0.9375rem] font-semibold text-brown no-underline hover:bg-hover hover:text-brown">
          Fechar
        </Link>
      </div>
      <p className="m-0 text-[0.9375rem] leading-normal text-brown-600">A ordem aqui é a ordem na página pública. Tema sem pergunta no ar não aparece no site.</p>

      {problem && <Alert tone="error">{problem}</Alert>}

      <ul aria-label="Temas" className="m-0 flex list-none flex-col p-0">
        {data.themes.map((theme, index) => {
          const total = data.items.filter((item) => item.themeId === theme.id).length
          const onAir = data.items.filter((item) => item.themeId === theme.id && item.published).length
          return (
            <li key={theme.id} className="flex flex-col gap-2 border-t border-line py-3">
              {editing === theme.id ? (
                <form onSubmit={(event) => save(event, theme.id)} className="flex flex-col gap-2">
                  <TextField label="Nome do tema" name="themeName" maxLength={40} value={editName} onChange={(e) => setEditName(e.target.value)} />
                  <div className="flex gap-2">
                    <Button type="submit" size="compact" className="min-h-11" loading={rename.isPending}>
                      Salvar
                    </Button>
                    <Button type="button" variant="secondary" size="compact" className="min-h-11" onClick={() => setEditing(null)}>
                      Cancelar
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <div className="flex items-center justify-between gap-3">
                    <span className="flex min-w-0 flex-col">
                      <span className="flex flex-wrap items-center gap-2 text-[1rem] font-bold">
                        {theme.name}
                        {!theme.published && <span className="rounded-full border-[1.5px] border-dashed border-brown px-2 py-0.5 text-[0.71875rem]">Fora do ar</span>}
                      </span>
                      <span className="text-[0.78125rem] text-brown-400">{counting(total, onAir)}</span>
                    </span>
                    <span className="flex gap-1">
                      <button type="button" aria-label={`Subir o tema ${theme.name}`} disabled={index === 0 || busy} onClick={() => move.mutate({ id: theme.id, direction: 'up' }, { onError: fail })} className={ARROW}>
                        <span aria-hidden="true">↑</span>
                      </button>
                      <button
                        type="button"
                        aria-label={`Descer o tema ${theme.name}`}
                        disabled={index === data.themes.length - 1 || busy}
                        onClick={() => move.mutate({ id: theme.id, direction: 'down' }, { onError: fail })}
                        className={ARROW}
                      >
                        <span aria-hidden="true">↓</span>
                      </button>
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="compact"
                      className="min-h-11"
                      onClick={() => {
                        setProblem(null)
                        setEditing(theme.id)
                        setEditName(theme.name)
                      }}
                    >
                      Renomear <span className="sr-only">{theme.name}</span>
                    </Button>
                    <Button type="button" variant="secondary" size="compact" className="min-h-11" disabled={busy} onClick={() => toggle(theme.id, theme.published, total, onAir)}>
                      {theme.published ? 'Tirar do ar' : 'Pôr no ar'} <span className="sr-only">{theme.name}</span>
                    </Button>
                  </div>
                </>
              )}
            </li>
          )
        })}
      </ul>

      <form onSubmit={add} className="flex flex-col gap-2 border-t border-line pt-4">
        <TextField label="Novo tema" name="newThemeName" maxLength={40} placeholder="Ex.: Biblioteca digital" value={newName} onChange={(e) => setNewName(e.target.value)} />
        <Button type="submit" size="compact" className="min-h-11 self-start" loading={create.isPending}>
          Adicionar
        </Button>
        <span className="text-[0.84375rem] leading-normal text-brown-400">Tirar um tema do ar esconde todas as perguntas dele no site. Elas continuam guardadas e voltam quando o tema voltar.</span>
      </form>
    </div>
  )
}
