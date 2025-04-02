import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Add alias for redux-persist subpaths
      'redux-persist/integration/react': path.resolve(__dirname, 'node_modules/redux-persist/integration/react')
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      // Add specific external dependencies with proper input format
      external: [],
      output: {
        manualChunks: {
          'vendor': [
            'react',
            'react-dom',
            'react-router-dom',
            'react-redux',
            '@reduxjs/toolkit',
            'redux-persist'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react-redux',
      'react-router-dom',
      'prop-types',
      'redux-persist',
      'redux-persist/integration/react'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
