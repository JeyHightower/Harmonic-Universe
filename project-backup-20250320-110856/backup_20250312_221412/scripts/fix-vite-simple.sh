#!/bin/bash
set -e

if [ ! -d "frontend" ]; then
  echo "frontend directory not found"
  exit 1
fi

cd frontend

# Check if vite.config.js exists
if [ ! -f "vite.config.js" ]; then
  echo "vite.config.js not found, skipping"
  exit 0
fi

# Create updated vite config that uses dist directory
cat > vite.config.js.new << 'EOFVITE'
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
  },
  build: {
    outDir: 'dist',
    assetsDir: 'static',
    sourcemap: true,
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  },
  optimizeDeps: {
    esbuildOptions: {
      loader: {
        '.js': 'jsx',
      },
    },
  },
});
EOFVITE

# Backup old config
cp vite.config.js vite.config.js.backup

# Replace with new config
mv vite.config.js.new vite.config.js
echo "vite.config.js updated successfully"
