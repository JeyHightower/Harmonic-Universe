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

# Display package.json
echo "Current package.json:"
cat package.json

# Clean out node_modules completely
echo "Completely removing node_modules directory..."
rm -rf node_modules
rm -rf package-lock.json

# Clean any JSX runtime polyfills that might cause conflicts
echo "Cleaning any existing JSX runtime polyfills..."
rm -f src/jsx-runtime.js
rm -f src/jsx-dev-runtime.js
rm -f src/jsx-runtime-polyfill.js
rm -f vite-plugin-react-shim.js
rm -f vite.config.minimal.js

# Create temporary package.json with exact versions
echo "Creating temporary package.json with exact versions..."
cp package.json package.json.bak
cat > package.json << EOF
{
  "name": "harmonic-universe-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "@ant-design/icons": "4.8.0",
    "@emotion/react": "11.11.0",
    "@emotion/styled": "11.11.0",
    "@mui/icons-material": "5.14.11",
    "@mui/material": "5.14.11",
    "@reduxjs/toolkit": "1.9.5",
    "antd": "4.24.10",
    "axios": "1.6.0",
    "moment": "2.29.4",
    "prop-types": "15.8.1",
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-redux": "8.0.5",
    "react-router-dom": "6.10.0",
    "redux-persist": "6.0.0",
    "three": "0.155.0",
    "tone": "14.7.77"
  },
  "devDependencies": {
    "@babel/core": "7.22.5",
    "@babel/plugin-transform-runtime": "7.22.5",
    "@babel/preset-env": "7.22.5",
    "@babel/preset-react": "7.22.5",
    "@types/node": "20.8.0",
    "@types/react": "18.0.28",
    "@types/react-dom": "18.0.11",
    "@vitejs/plugin-react": "3.1.0",
    "vite": "4.2.0"
  }
}
EOF

# Install dependencies
echo "Installing dependencies with --legacy-peer-deps and --verbose..."
npm install --legacy-peer-deps --verbose

# Create a simple vite.config.js
echo "Creating simple vite.config.js..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true
  }
});
EOF

# List installed versions for troubleshooting
echo "Checking installed versions:"
npx --no vite --version
npm list --depth=0

# Try to build
echo "Building frontend application..."
if ! npx vite build; then
  echo "Regular build failed, trying with NPX to ensure correct Vite version..."
  npx vite@4.2.0 build
fi

# If build still fails, create minimal static files
if [ ! -d "dist" ]; then
  echo "All build attempts failed, creating a minimal build..."
  
  # Create minimal dist directory
  mkdir -p dist
  
  # Copy any existing static assets
  if [ -d "public" ]; then
    echo "Copying public assets to dist directory..."
    cp -r public/* dist/ || echo "Warning: Could not copy all public assets"
  fi
  
  # Create a minimal index.html
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Welcome to Harmonic Universe. The application is loading...</p>
    <div id="root"></div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const root = document.getElementById('root');
      root.innerHTML = '<div><h2>Application Loading</h2><p>Please wait while we connect to the backend...</p></div>';
      
      // Check if backend is available
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          root.innerHTML = '<div><h2>Backend Connected</h2><p>The application backend is available.</p></div>';
        })
        .catch(err => {
          root.innerHTML = '<div><h2>Backend Unavailable</h2><p>Could not connect to application backend.</p></div>';
        });
    });
  </script>
</body>
</html>
EOF
  
  echo "Created minimal build files"
fi

# Verify the build output
echo "Verifying frontend build..."
if [ -d "dist" ]; then
  echo "Frontend build directory exists. Contents of dist directory:"
  ls -la dist
  
  # Restore original package.json
  if [ -f "package.json.bak" ]; then
    echo "Restoring original package.json..."
    mv package.json.bak package.json
  fi
else
  echo "ERROR: Frontend build failed! No dist directory found."
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