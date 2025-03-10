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

# Clear any existing installations
echo "===== CLEANING UP ====="
rm -rf node_modules package-lock.json
rm -rf .vite dist

# Create package.json first
echo "===== CREATING PACKAGE.JSON ====="
cat > package.json << 'EOF'
{
  "name": "harmonic-universe-frontend",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.22.3",
    "vite": "^5.1.6",
    "@vitejs/plugin-react": "^4.2.1"
  },
  "devDependencies": {
    "@types/react": "^18.2.64",
    "@types/react-dom": "^18.2.21"
  }
}
EOF

# Install dependencies
echo "===== INSTALLING DEPENDENCIES ====="
# First install Vite and its plugin
echo "Installing Vite and React plugin..."
npm install vite@latest @vitejs/plugin-react@latest --save-exact || exit 1

# Then install remaining dependencies
echo "Installing remaining dependencies..."
npm install || exit 1

# Verify Vite installation
echo "===== VERIFYING VITE INSTALLATION ====="
if [ ! -f "node_modules/.bin/vite" ]; then
    echo "Vite binary not found, attempting global installation..."
    npm install -g vite || true
fi

# Create vite config
echo "===== CREATING VITE CONFIG ====="
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../static',
    emptyOutDir: true
  }
})
EOF

# Build the frontend
echo "===== BUILDING FRONTEND ====="
export NODE_ENV=production
export NODE_PATH="$PWD/node_modules"

# Attempt build with fallbacks
echo "Attempting build..."
if command -v npx &> /dev/null; then
    echo "Using npx..."
    npx vite build
else
    echo "Falling back to direct node execution..."
    node node_modules/vite/bin/vite.js build
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

echo "===== BUILD PROCESS COMPLETE ====="
echo "Final static directory contents:"
ls -la static/

# Exit successfully
exit 0
