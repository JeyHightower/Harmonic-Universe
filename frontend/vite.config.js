import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Detect environment
const isProd = process.env.NODE_ENV === 'production' || process.env.VITE_APP_ENV === 'production';
const isDebug = process.env.DEBUG || process.env.VITE_VERBOSE;

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',

  define: {
    'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    'process.env.VITE_APP_ENV': JSON.stringify(isProd ? 'production' : 'development')
  },

  build: {
    outDir: 'dist',
    sourcemap: isProd ? false : true,
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
        entryFileNames: 'assets/[name].[hash].js',
        chunkFileNames: 'assets/[name].[hash].js',
        assetFileNames: ({ name }) => {
          if (/\.(gif|jpe?g|png|svg)$/.test(name ?? '')) {
            return 'images/[name].[hash][extname]';
          }

          if (/\.css$/.test(name ?? '')) {
            return 'styles/[name].[hash][extname]';
          }

          return 'assets/[name].[hash][extname]';
        },
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('scheduler') || id.includes('prop-types')) {
              return 'vendor-react';
            }
            if (id.includes('redux')) {
              return 'vendor-redux';
            }
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }
            return 'vendor';
          }
        }
      }
    }
  },

  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
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
