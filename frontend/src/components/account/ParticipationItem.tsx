import { Link } from 'react-router-dom'
import { Chevron } from '../ui'

interface ParticipationItemProps {
  title: string
  description?: string
  to: string
}

export function ParticipationItem({ title, description, to }: ParticipationItemProps) {
  return (
    <li className="border-b border-line">
      <Link to={to} className="group grid min-h-16 grid-cols-[1fr_1rem] items-center gap-2 py-3 text-brown no-underline hover:text-brown">
        <span className="flex flex-col">
          <span className="text-[1rem] leading-[1.2] font-bold transition-colors group-hover:text-blue-deep">{title}</span>
          {description && <span className="text-[0.84375rem] leading-[1.3] text-brown-400">{description}</span>}
        </span>
        <span className="transition-transform duration-150 group-hover:translate-x-1">
          <Chevron />
        </span>
      </Link>
    </li>
  )
}
