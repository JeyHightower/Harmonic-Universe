#!/bin/bash
# build.sh - Comprehensive build process for Harmonic Universe
set -e  # Exit on error

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Set up Node.js environment
echo "==> Setting up Node.js environment"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python -V)"

# Install Python dependencies
echo "===== INSTALLING PYTHON DEPENDENCIES ====="
python -m pip install --upgrade pip
pip install -r requirements.txt

# Prepare directory structure
echo "===== PREPARING DIRECTORY STRUCTURE ====="
mkdir -p static

# Set up and build frontend
echo "===== SETTING UP FRONTEND ====="
cd frontend

# Clear any existing node_modules
echo "===== CLEANING UP ====="
rm -rf node_modules
rm -rf .vite

# Install dependencies
echo "===== INSTALLING DEPENDENCIES ====="
# Install vite and plugin-react first
npm install --save-dev vite@latest @vitejs/plugin-react@latest
# Then install other dependencies
npm install --legacy-peer-deps

# Create temporary vite config
echo "===== CREATING VITE CONFIG ====="
cat > vite.config.js << 'EOF'
const { defineConfig } = require('vite')
const react = require('@vitejs/plugin-react')
const path = require('path')

module.exports = defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: undefined
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
})
EOF

# Build the frontend with explicit node path
echo "===== BUILDING FRONTEND ====="
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules"
./node_modules/.bin/vite build --config vite.config.js

# Copy React production files if needed
echo "===== COPYING REACT PRODUCTION FILES ====="
cd ..
if [ ! -f "static/react.production.min.js" ]; then
  cp frontend/node_modules/react/umd/react.production.min.js static/ || echo "Warning: Could not copy react.production.min.js"
fi
if [ ! -f "static/react-dom.production.min.js" ]; then
  cp frontend/node_modules/react-dom/umd/react-dom.production.min.js static/ || echo "Warning: Could not copy react-dom.production.min.js"
fi

# Create version info
echo "===== CREATING VERSION INFO ====="
echo "{\"version\": \"1.0.0\", \"buildDate\": \"$(date)\"}" > static/build-info.json

# Create diagnostic script
echo "===== CREATING DIAGNOSTIC SCRIPT ====="
cat > static/runtime-diagnostics.js << 'EOF'
console.log('Runtime diagnostics loaded');
window.APP_VERSION = {
  buildDate: '$(date)',
  environment: 'production'
};
EOF

echo "===== BUILD PROCESS COMPLETE ====="
echo "Final static directory contents:"
ls -la static/

# Exit successfully
exit 0
