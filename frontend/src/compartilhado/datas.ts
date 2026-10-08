/** Datas sempre no fuso da ONG, nunca no do aparelho de quem visita. */
export const FUSO = 'America/Sao_Paulo'

function parte(data: Date, opcoes: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('pt-BR', { timeZone: FUSO, ...opcoes }).format(data)
}

export function partesDaData(data: Date) {
  return {
    semana: parte(data, { weekday: 'short' }).replace('.', '').toLocaleUpperCase('pt-BR'),
    dia: parte(data, { day: '2-digit' }),
    mes: parte(data, { month: 'short' }).replace('.', '').toLocaleUpperCase('pt-BR'),
    porExtenso: parte(data, { weekday: 'long', day: 'numeric', month: 'long' }),
  }
}
