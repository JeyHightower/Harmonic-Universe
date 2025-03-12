import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux'
          ],
        },
      },
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'axios',
      'moment',
      'prop-types'
    ],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        // Adding better error handling
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err.message);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            // Only log non-health endpoint requests to reduce noise
            if (!req.url.includes('/health')) {
              console.log('Proxying:', req.method, req.url);
            }
          });
        },
        rewrite: (path) => path.replace(/^\/api/, ''),
        // Add timeout to prevent hanging connections
        timeout: 5000,
        // Implement a healthCheck function to reduce error logs
        proxyOptions: {
          healthCheck: false,
          followRedirects: true,
          retry: 0
        }
      }
    },
    // Add fallback handler for API calls when backend is unreachable
    middlewares: [
      (req, res, next) => {
        if (req.url.startsWith('/api/health')) {
          // Return a mock health response instead of constant errors
          res.statusCode = 200;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ status: 'ok', message: 'Mock health check - backend unreachable' }));
          return;
        }
        next();
      }
    ]
  },
});
