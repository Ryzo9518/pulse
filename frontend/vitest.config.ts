import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// Mirrors the `@/*` -> `./` alias from tsconfig.json so `@/types`,
// `@/lib`, etc. resolve in tests the same way they do in the Next.js app.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
      // `server-only` is a Next.js virtual that vite can't resolve; stub it.
      'server-only': path.resolve(__dirname, 'test-stubs-server-only.ts'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
})
