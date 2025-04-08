import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production'),
    'process.env.VITE_APP_ENV': JSON.stringify(process.env.VITE_APP_ENV || 'production')
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    emptyOutDir: true,
    minify: 'terser',
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'redux-persist': path.resolve(__dirname, 'node_modules/redux-persist'),
      'redux-persist/integration/react': path.resolve(__dirname, 'node_modules/redux-persist/integration/react'),
      'redux-persist/lib/storage': path.resolve(__dirname, 'node_modules/redux-persist/lib/storage')
    }
  }
}); 