import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';

const useRealDatabase = process.env.DB_TESTS === '1';

Object.assign(process.env, {
  NODE_ENV: 'test',
  CORS_ORIGINS: 'http://localhost:5173',
  JWT_SECRET: 'test-secret-with-more-than-thirty-two-characters',
  JWT_EXPIRES_IN: '1h',
  TRUST_PROXY: '1',
  UPLOADS_DIR: path.join(os.tmpdir(), `atelie-uploads-${randomUUID()}`),
  ...(useRealDatabase
    ? {}
    : { DB_HOST: 'localhost', DB_NAME: 'atelie_test', DB_USER: 'test', DB_PASSWORD: 'test' }),
});
