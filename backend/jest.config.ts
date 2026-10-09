import type { Config } from 'jest';

const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testPathIgnorePatterns: process.env.DB_TESTS === '1' ? [] : ['/tests/integration/'],
  transform: {
    '^.+\\.ts$': ['@swc/jest', { jsc: { target: 'es2022' }, module: { type: 'commonjs' } }],
  },
  setupFiles: ['<rootDir>/tests/setup-env.ts'],
  clearMocks: true,
};

export default config;
