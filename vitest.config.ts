import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./apps/web/src/test-setup.ts'],
    include: ['apps/**/*.test.{ts,tsx}', 'packages/**/*.test.{ts,tsx}', 'packages/**/*.spec.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      include: ['apps/web/src/**', 'packages/api-client/src/**'],
      exclude: [
        '**/*.test.*', '**/*.spec.*', '**/*.d.ts',
        'apps/web/src/main.tsx',
        'apps/web/src/routes/**',
        'apps/web/src/styles/**',
        'apps/web/src/components/**',
        'apps/web/src/hooks/**',
        'apps/web/src/lib/queryKeys.ts',
        'packages/api-client/src/types/**',
      ],
      thresholds: {
        statements: 80,
        branches: 80,
        functions: 80,
        lines: 80,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './apps/web/src'),
    },
  },
});
