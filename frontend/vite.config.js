import { defineConfig } from 'vite';
import path from 'path';
import react from '@vitejs/plugin-react';
import antIconsFix from './vite-plugins/ant-icons-fix';

// https://vite.dev/config/
export default defineConfig({
  cacheDir: '.vite-cache',
  plugins: [
    // Simplify to just the essential plugins
    react(),
    antIconsFix()
  ],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
      'components': path.resolve(__dirname, 'src/components')
    },
  },
  define: {
    // Define global variables to ensure the version is always available
    '__ANT_ICONS_VERSION__': JSON.stringify('4.2.1'),
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false,
      },
    },
    chunkSizeWarningLimit: 1500,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'ant-design': ['antd']
        }
      }
    },
    assetsInlineLimit: 4096,
    copyPublicDir: true,
  },
  optimizeDeps: {
    include: ['classnames', 'react', 'react-dom', 'antd']
  }
});
