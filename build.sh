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
# Install requirements without hash verification for build process
echo "Installing Python packages..."
if [ -f "requirements.txt" ]; then
    pip install --no-cache-dir -r requirements.txt || pip install --no-cache-dir --no-deps -r requirements.txt
fi

# Prepare directory structure
echo "===== PREPARING DIRECTORY STRUCTURE ====="
mkdir -p static

# Set up and build frontend
echo "===== SETTING UP FRONTEND ====="
cd frontend || exit 1
echo "Current directory: $(pwd)"

# Clear any existing node_modules
echo "===== CLEANING UP ====="
rm -rf node_modules package-lock.json
rm -rf .vite dist

# Install dependencies
echo "===== INSTALLING DEPENDENCIES ====="
# First, verify npm is working
npm -v || exit 1

# Install Vite globally first
echo "Installing Vite globally..."
npm install -g vite || true

# Install dependencies with legacy peer deps
echo "Installing project dependencies..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm install --legacy-peer-deps

# Ensure Vite and React plugin are installed
echo "Installing Vite and React plugin..."
npm install --save-dev vite@latest @vitejs/plugin-react@latest

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

# Build the frontend
echo "===== BUILDING FRONTEND ====="
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules:$NODE_PATH"

# Try different build commands in order of preference
echo "Attempting build..."
if [ -f "node_modules/.bin/vite" ]; then
    echo "Using local Vite installation..."
    ./node_modules/.bin/vite build
elif command -v vite >/dev/null 2>&1; then
    echo "Using global Vite installation..."
    vite build
else
    echo "Using npx fallback..."
    npx --no-install vite build
fi

# Verify build output
echo "===== VERIFYING BUILD ====="
cd ..
if [ ! -d "static" ] || [ ! "$(ls -A static 2>/dev/null)" ]; then
    echo "Error: Build failed - static directory is empty or missing"
    exit 1
fi

# Copy React production files if needed
echo "===== COPYING REACT PRODUCTION FILES ====="
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
