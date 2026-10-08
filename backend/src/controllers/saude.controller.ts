import type { Request, Response } from 'express';
import { verificarSaude } from '../services/saude.service';

export async function consultarSaude(_req: Request, res: Response): Promise<void> {
  const estado = await verificarSaude();
  res.status(estado.status === 'ok' ? 200 : 503).json(estado);
}
