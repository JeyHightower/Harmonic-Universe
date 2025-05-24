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
    chunkSizeWarningLimit: 1000, // Increase limit to 1MB since we've optimized chunking
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react';
            }

            // Redux ecosystem
            if (id.includes('redux') || id.includes('@reduxjs/toolkit')) {
              return 'vendor-redux';
            }

            // Ant Design ecosystem
            if (id.includes('antd') || id.includes('@ant-design')) {
              return 'vendor-antd';
            }

            // Material-UI ecosystem (large)
            if (id.includes('@mui') || id.includes('@emotion')) {
              return 'vendor-mui';
            }

            // Three.js (very large 3D library)
            if (id.includes('three')) {
              return 'vendor-three';
            }

            // Audio libraries (large)
            if (id.includes('tone')) {
              return 'vendor-audio';
            }

            // Animation libraries
            if (id.includes('framer-motion')) {
              return 'vendor-animation';
            }

            // Date/time libraries
            if (id.includes('dayjs') || id.includes('moment')) {
              return 'vendor-datetime';
            }

            // Utility libraries (smaller)
            if (
              id.includes('axios') ||
              id.includes('classnames') ||
              id.includes('prop-types') ||
              id.includes('history')
            ) {
              return 'vendor-utils';
            }

            // Remaining smaller dependencies
            return 'vendor-misc';
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
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
        secure: false,
        ws: true,
      },
    },
  },
});
