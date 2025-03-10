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

# Install dependencies with legacy peer deps
echo "Installing project dependencies..."
export NODE_OPTIONS="--max-old-space-size=4096"

# Install core dependencies first
echo "Installing core dependencies..."
npm install vite@latest @vitejs/plugin-react@latest --save-dev
npm install react react-dom react-router-dom --save

# Then install remaining dependencies
echo "Installing remaining dependencies..."
npm install --legacy-peer-deps

# Create temporary vite config
echo "===== CREATING VITE CONFIG ====="
cat > vite.config.js << 'EOF'
// @ts-check
const loadConfig = async () => {
  try {
    // Try ESM first
    const { defineConfig } = await import('vite')
    const react = await import('@vitejs/plugin-react')
    const path = await import('path')
    const { fileURLToPath } = await import('url')

    const __filename = fileURLToPath(import.meta.url)
    const __dirname = path.dirname(__filename)

    return defineConfig({
      plugins: [react.default()],
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
  } catch (e) {
    // Fallback to CommonJS
    const { defineConfig } = require('vite')
    const react = require('@vitejs/plugin-react')
    const path = require('path')

    return defineConfig({
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
  }
}

export default loadConfig()
EOF

# Build the frontend
echo "===== BUILDING FRONTEND ====="
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules"

# Try to build with different Node.js options
echo "Attempting build..."
NODE_OPTIONS="--experimental-json-modules --no-warnings --es-module-specifier-resolution=node" npx vite build

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
