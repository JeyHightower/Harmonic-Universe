#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             LOCAL BUILD DEPENDENCY FIX SCRIPT            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Go to frontend directory
cd frontend

# Create optimized vite.config.js file for dependency resolution
echo "📝 Creating optimized Vite config..."
cat > vite.config.js << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],

  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux', 'antd'],
        }
      }
    }
  },

  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'antd'
    ]
  }
});
EOF

# Remove node_modules and package-lock if needed
echo "🧹 Cleaning up previous installations..."
rm -rf node_modules || true
rm -f package-lock.json || true

# Install dependencies properly
echo "📦 Installing dependencies..."
npm install

echo "✅ Setup complete! You can now try running: npm run dev"
echo "If you still have issues, try running: npm run build"
