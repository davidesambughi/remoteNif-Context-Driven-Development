import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },

  test: {
    include: ['tests/integration/**/*.test.ts'],
    environment: 'node',
    globals: false,
    setupFiles: ['tests/integration/setup.ts'],
    env: {
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5433/nif3_test',
      NODE_ENV: 'test',
      // Stub remaining env vars so lib/env.ts parse attempt doesn't abort process.
      // The schema falls back gracefully in non-production — only DATABASE_URL matters here.
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
    // Run test files serially — parallel files would interleave seed/teardown
    // and cause spurious FK violations across concurrent DB connections.
    fileParallelism: false,
  },
})
