import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    include: ['**/*.test.{ts,tsx}'],
    exclude: ['node_modules', '.next'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov', 'html'],
      exclude: [
        'node_modules',
        '.next',
        '**/*.test.{ts,tsx}',
        'test/**',
        '**/*.d.ts',
        '*.config.{ts,js,mjs}',
        'app/layout.tsx',
        'app/globals.css',
      ],
      thresholds: {
        statements: 70,
        branches: 70,
        functions: 70,
        lines: 70,
      },
    },
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
