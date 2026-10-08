import type { Config } from 'jest';

// @swc/jest só transpila; quem confere os tipos é `npm run typecheck`.
const config: Config = {
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  transform: {
    '^.+\\.ts$': ['@swc/jest', { jsc: { target: 'es2022' }, module: { type: 'commonjs' } }],
  },
  setupFiles: ['<rootDir>/tests/ambiente.ts'],
  clearMocks: true,
};

export default config;
