import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Detect environment
const isProd = process.env.NODE_ENV === 'production' || process.env.VITE_APP_ENV === 'production';
const isDebug = process.env.DEBUG || process.env.VITE_VERBOSE;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],

  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.VITE_APP_ENV': JSON.stringify(isProd ? 'production' : 'development')
  },

  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: isProd ? 'terser' : false,
    terserOptions: {
      compress: {
        drop_console: isProd && !isDebug,
        drop_debugger: isProd && !isDebug
      }
    },
    chunkSizeWarningLimit: 1600,
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Put all redux-persist code in one chunk
          if (id.includes('redux-persist')) {
            return 'redux-persist';
          }
          // Put all MUI related code in one chunk
          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'material-ui';
          }
          // Group react and core deps
          if (id.includes('react') || id.includes('redux')) {
            return 'vendor-core';
          }
          return undefined;
        },
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: 'assets/[name].[hash].[ext]'
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
  },

  // Ensure Vite doesn't time out for slow connections
  server: {
    hmr: {
      timeout: 10000
    }
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-redux',
      'react-router-dom',
      'redux-persist',
      'redux-persist/integration/react',
      'redux-persist/lib/storage'
    ],
    esbuildOptions: {
      jsx: 'automatic',
      treeShaking: true
    }
  }
});
