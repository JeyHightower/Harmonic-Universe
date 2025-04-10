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
    chunkSizeWarningLimit: 5000,
    target: 'es2015',
    cssTarget: 'chrome80',

    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html')
      },
      output: {
        format: 'es',
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },

  // Disable optimizeDeps for problematic packages
  optimizeDeps: {
    disabled: true
  },

  resolve: {
    mainFields: ['browser', 'module', 'main'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    dedupe: ['react', 'react-dom']
  },

  // Needed for windows compatibility
  server: {
    fs: {
      strict: false
    }
  },
}); 