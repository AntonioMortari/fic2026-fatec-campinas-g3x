Object.assign(process.env, {
  NODE_ENV: 'test',
  CORS_ORIGINS: 'http://localhost:5173',
  DB_HOST: 'localhost',
  DB_NAME: 'atelie_test',
  DB_USER: 'test',
  DB_PASSWORD: 'test',
  JWT_SECRET: 'test-secret-with-more-than-thirty-two-characters',
  JWT_EXPIRES_IN: '1h',
});
