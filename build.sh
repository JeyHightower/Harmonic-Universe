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

# Install all dependencies
echo "Installing all dependencies..."
npm install || exit 1

# Verify vite installation
echo "Verifying vite installation..."
if [ ! -f "node_modules/.bin/vite" ]; then
    echo "Vite not found, installing explicitly..."
    npm install --save-dev vite@latest @vitejs/plugin-react@latest
fi

# Create temporary vite config
echo "===== CREATING VITE CONFIG ====="
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
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
export NODE_PATH="$PWD/node_modules"

# Try different build commands in order of preference
echo "Attempting build..."
if npx vite build; then
    echo "Build successful with npx vite build"
elif npm run build; then
    echo "Build successful with npm run build"
else
    echo "Build failed with both methods"
    exit 1
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
