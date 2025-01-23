import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [path.resolve(__dirname, './frontend/src/setupTests.js')],
    include: [
      'frontend/src/**/*.{test,spec}.{js,jsx}',
      'frontend/tests/**/*.{test,spec}.{js,jsx}',
    ],
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'tests/setup/**'],
    },
  },
});
