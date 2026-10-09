import { Link } from 'react-router-dom'
import { Card } from '../ui'

export function SchoolsPromo() {
  return (
    <Card className="hidden flex-col gap-2 p-4.5 desktop:flex">
      <p className="m-0 text-item font-bold">Quer uma atividade na sua escola?</p>
      <Link to="/para-escolas" className="inline-flex min-h-11 items-center font-semibold">
        Ver como funciona →
      </Link>
    </Card>
  )
}
