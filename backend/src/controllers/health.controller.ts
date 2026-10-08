import type { Request, Response } from 'express';
import { checkHealth } from '../services/health.service';

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const health = await checkHealth();
  res.status(health.status === 'ok' ? 200 : 503).json(health);
}
