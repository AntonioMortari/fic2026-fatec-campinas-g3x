import { Link } from 'react-router-dom'
import { FAQ_PATH } from '../../lib/faq'

interface FaqHintProps {
  links: { id?: string; text: string }[]
  className?: string
}

// Design 18c: one line that takes the question to where the doubt appears; the answer opens already on arrival.
export function FaqHint({ links, className }: FaqHintProps) {
  return (
    <p className={`m-0 flex items-baseline gap-2 border border-line bg-card px-3 py-2.5 text-[0.90625rem] leading-[1.45] ${className ?? ''}`}>
      <span aria-hidden="true" className="size-2 flex-none -translate-y-px bg-ochre" />
      <span className="flex flex-col">
        {links.map((link) => (
          <Link key={link.text} to={link.id ? `${FAQ_PATH}#${link.id}` : FAQ_PATH} className="inline-flex min-h-11 items-center">
            {link.text}
          </Link>
        ))}
      </span>
    </p>
  )
}
