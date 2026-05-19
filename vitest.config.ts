import { defineConfig } from 'vitest/config'

export default defineConfig({
  resolve: {
    // Reads the paths alias from tsconfig.json so @/ resolves correctly.
    // Without this, imports like '@/lib/pricing' would fail with "module not found".
    tsconfigPaths: true,
  },

  test: {
    // Run tests in a Node.js environment (no browser APIs).
    // Use 'jsdom' here if you ever need to test React components.
    environment: 'node',

    // Where to look for test files.
    // Includes both .ts and .tsx so email template tests (which use React) are picked up.
    include: ['tests/**/*.test.ts', 'tests/**/*.test.tsx'],
  },
})
