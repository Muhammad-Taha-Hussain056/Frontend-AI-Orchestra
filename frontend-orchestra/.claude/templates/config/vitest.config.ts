import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/vitest.setup.ts'],
    globals: false,
    css: false,
    env: { TZ: 'UTC' },                         // date tests also run under another zone: TZ=America/Los_Angeles pnpm test
    coverage: { provider: 'v8', reporter: ['text', 'lcov'], thresholds: { lines: 70 } },
  },
});
