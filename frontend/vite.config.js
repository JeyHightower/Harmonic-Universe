import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import copyReactFixesPlugin from './src/utils/vite-plugins/copy-react-fixes.mjs';

// Detect environment
const isProd =
  import.meta?.env?.PROD ||
  process.env.NODE_ENV === 'production' ||
  process.env.VITE_APP_ENV === 'production';
const isDebug = import.meta?.env?.DEBUG || process.env.DEBUG || process.env.VITE_VERBOSE;

// Configure Vite
export default defineConfig({
  plugins: [react(), copyReactFixesPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'redux'],
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'redux',
      'react-redux',
      '@reduxjs/toolkit',
      'antd',
      '@ant-design/icons',
      'dayjs',
      'classnames',
    ],
    exclude: ['react-jsx-dev-runtime'],
    force: true,
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            if (id.includes('react')) {
              return 'vendor-react';
            }
            if (id.includes('redux')) {
              return 'vendor-redux';
            }
            if (id.includes('antd')) {
              return 'vendor-antd';
            }
            return 'vendor';
          }
        },
      },
    },
  },
  server: {
    host: true,
    port: 5173,
    cors: true,
    hmr: {
      timeout: 10000,
    },
  },
});
