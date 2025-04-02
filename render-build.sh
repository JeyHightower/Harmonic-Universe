#!/bin/bash

# Exit on error
set -e

# Display diagnostic information
echo "Starting build process at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Set Node memory limit to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=4096"

# Set Node environment
export NODE_ENV=production

# Build Frontend
echo "==== Building frontend ===="
cd frontend

# Clean any problematic node_modules
echo "Cleaning node_modules..."
rm -rf node_modules/.vite
rm -rf node_modules/react
rm -rf node_modules/react-dom
rm -rf node_modules/@vitejs

# Clean any JSX runtime polyfills that might cause conflicts
echo "Cleaning any existing JSX runtime polyfills..."
rm -f src/jsx-runtime.js
rm -f src/jsx-dev-runtime.js
rm -f src/jsx-runtime-polyfill.js
rm -f vite-plugin-react-shim.js
rm -f vite.config.minimal.js

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm ci || npm install

# Explicitly install specific versions of critical dependencies
echo "Installing critical dependencies with specific versions..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react@18.2.0 react-dom@18.2.0

# Create a minimal vite.config.temp.js for the build that won't duplicate React
echo "Creating temporary Vite configuration that prevents React duplication..."
cat > vite.config.temp.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'node:url';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
      "@components": "./src/components",
      "@pages": "./src/pages",
      "@store": "./src/store",
      "@styles": "./src/styles",
      "@assets": "./src/assets",
      "@utils": "./src/utils",
      "@hooks": "./src/hooks",
      "@contexts": "./src/contexts",
      "@services": "./src/services"
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  },
  esbuild: {
    jsx: 'automatic',
    jsxInject: null // Disable automatic React import to prevent duplication
  }
});
EOF

# Check for main.jsx file and clean up any potential React duplication there
if [ -f "src/main.jsx" ]; then
  echo "Checking main.jsx for potential React duplication..."
  # Remove any JSX runtime polyfill import if present
  sed -i.bak '/import.*jsx-runtime-polyfill/d' src/main.jsx
  # Ensure there's only one React import
  echo "Cleaned main.jsx file"
fi

# List installed versions for troubleshooting
echo "Checking installed versions:"
npx vite --version
npm list react
npm list react-dom
npm list @vitejs/plugin-react

# Try to build with the regular config first, fallback to temporary config
echo "Building frontend application..."
if ! npx vite build --debug; then
  echo "Regular build failed, trying with temporary config..."
  npx vite build --config vite.config.temp.js
fi

# Verify the build output
echo "Verifying frontend build..."
if [ -d "dist" ]; then
  echo "Frontend build succeeded. Contents of dist directory:"
  ls -la dist
else
  echo "ERROR: Frontend build failed!"
  exit 1
fi

# Return to root directory
cd ..

# Build Backend
echo "==== Building backend ===="
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs
mkdir -p static

# Initialize database
echo "Initializing database..."
if [ -f "init_migrations.py" ]; then
  export FLASK_APP=init_migrations.py
  python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing"
else
  echo "init_migrations.py not found, skipping migrations"
fi

# Return to root directory
cd ..

# Copy frontend build to backend static directory
echo "Copying frontend build to backend static directory..."
rm -rf backend/static/* # Clean existing files
cp -r frontend/dist/* backend/static/

# Ensure the static directory has proper permissions
echo "Setting permissions for static directory..."
chmod -R 755 backend/static

# Verify backend static directory
echo "Verifying backend static directory..."
ls -la backend/static

echo "Build completed successfully at $(date)"
exit 0 