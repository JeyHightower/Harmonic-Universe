import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This special config disables Rollup native functionality
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
          ],
        },
      },
    },
  },
});
