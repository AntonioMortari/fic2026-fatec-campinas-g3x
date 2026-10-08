import { Link } from 'react-router-dom'
import { CONTATOS } from '../../compartilhado/contatos'
import { FaixaListrada } from '../ui/FaixaListrada'

/**
 * Rodapé compacto (Análise UX/UI, 2a e 6a): a faixa listrada da página —
 * a única — e três linhas. No desktop vira uma linha só. Os canais já
 * estão no menu e na página de contato; o rodapé não os repete por extenso.
 */
const LINK = 'inline-flex min-h-11 items-center'

export function Rodape() {
  return (
    <footer>
      <FaixaListrada />
      <div className="mx-auto flex max-w-pagina flex-col gap-1.5 px-4 pt-5.5 pb-7 text-secundario text-marrom-400 desktop:flex-row desktop:items-center desktop:justify-between desktop:gap-8 desktop:px-8">
        <p className="m-0">
          {CONTATOS.endereco}
          <span className="hidden desktop:inline"> · {CONTATOS.telefoneExibicao}</span>
        </p>
        <ul className="m-0 flex list-none flex-wrap gap-x-4 p-0">
          <li>
            <a className={LINK} href={CONTATOS.whatsapp} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </li>
          <li>
            <a className={LINK} href={CONTATOS.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
          </li>
          <li className="hidden desktop:list-item">
            <a className={LINK} href={CONTATOS.tiktok} target="_blank" rel="noreferrer">
              TikTok
            </a>
          </li>
          <li>
            <a className={LINK} href={`mailto:${CONTATOS.email}`}>
              E-mail
            </a>
          </li>
          <li>
            <Link className={LINK} to="/privacidade">
              Privacidade
            </Link>
          </li>
        </ul>
      </div>
    </footer>
  )
}
