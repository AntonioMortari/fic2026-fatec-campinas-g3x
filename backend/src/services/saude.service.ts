import { sequelize } from '../models';

export interface EstadoDaApi {
  status: 'ok' | 'degradado';
  banco: 'ok' | 'indisponivel';
  verificadoEm: string;
}

/** Pergunta ao MySQL se ele responde. Nunca lança: a falha vira estado. */
export async function verificarSaude(): Promise<EstadoDaApi> {
  const verificadoEm = new Date().toISOString();
  try {
    await sequelize.authenticate();
    return { status: 'ok', banco: 'ok', verificadoEm };
  } catch (erro) {
    console.error('[saude] banco indisponível:', erro instanceof Error ? erro.message : erro);
    return { status: 'degradado', banco: 'indisponivel', verificadoEm };
  }
}
