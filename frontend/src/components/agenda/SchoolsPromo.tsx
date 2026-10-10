import { Link } from 'react-router-dom'
import { Card } from '../ui'

export function SchoolsPromo() {
  return (
    <Card className="hidden flex-col gap-3 p-4.5 desktop:flex">
      <p className="m-0 text-base leading-[1.3] font-bold">Quer uma atividade na sua escola?</p>
      {/* The padding and the negative margin make the hit area 44px tall without making the card taller. */}
      <Link to="/para-escolas" className="-my-3.5 inline-flex items-center self-start py-3.5 text-[0.9375rem] leading-[1.2] font-semibold">
        Ver como funciona →
      </Link>
    </Card>
  )
}
