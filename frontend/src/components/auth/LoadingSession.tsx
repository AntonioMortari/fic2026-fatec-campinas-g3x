import { LoadingState } from '../ui'

export function LoadingSession() {
  return <LoadingState label="Carregando sua conta…" shape="lines" count={4} className="mx-auto min-h-[60dvh] w-full max-w-xl px-4 py-10" />
}
