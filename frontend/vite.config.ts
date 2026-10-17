import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: true,
    port: 5173,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/tests/setup.ts'],
    css: false,
    // Form tests type field by field and the files run in parallel: the 5s default fails on a busy machine without a real bug.
    testTimeout: 15000,
    // The tests expect relative addresses; a dev container or a .env.local sets the API address and would change them.
    env: { VITE_API_URL: '' },
  },
})
