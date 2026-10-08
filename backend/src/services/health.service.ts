import { sequelize } from '../models';

export interface HealthStatus {
  status: 'ok' | 'degraded';
  database: 'ok' | 'unavailable';
  checkedAt: string;
}

export async function checkHealth(): Promise<HealthStatus> {
  const checkedAt = new Date().toISOString();
  try {
    await sequelize.authenticate();
    return { status: 'ok', database: 'ok', checkedAt };
  } catch (error) {
    console.error('[health] database unavailable:', error instanceof Error ? error.message : error);
    return { status: 'degraded', database: 'unavailable', checkedAt };
  }
}
