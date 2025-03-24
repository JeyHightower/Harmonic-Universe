#!/bin/bash
set -e

echo "===== CONFIGURING VITE TO HANDLE JSX IN .JS FILES ====="
echo "Date: $(date)"

cd frontend

# Update the vite.config.js to handle JSX in .js files
echo "Updating Vite configuration to handle JSX in .js files..."
cat > vite.config.js << 'EOFINNER'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: true,
    chunkSizeWarningLimit: 1600,
  },
  // These settings tell Vite to treat .js files as JSX
  esbuild: {
    loader: 'jsx',  // This tells esbuild to treat .js files as JSX
    include: /src\/.*\.jsx?$/,  // Apply to both .js and .jsx files
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',  // This tells esbuild to treat .js files as JSX during dep optimization
      },
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
});
EOFINNER

echo "===== VITE CONFIGURATION UPDATED ====="
echo "Try building again with 'npm run build'"
echo "No files were renamed - Vite is now configured to handle JSX in .js files"
