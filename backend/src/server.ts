import { createApp } from './app';
import { env } from './config/env';
import { sequelize } from './models';

const server = createApp().listen(env.PORT, () => {
  console.info(`[api] listening on http://localhost:${env.PORT} (docs at /api-docs)`);
});

async function shutdown(signal: string) {
  console.info(`[api] ${signal} received, shutting down`);
  server.close();
  await sequelize.close();
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));
