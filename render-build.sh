#!/bin/bash

# Exit on error
set -e

echo "Starting build process for Harmonic Universe"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v || echo 'Node.js not found')"
echo "NPM version: $(npm -v || echo 'NPM not found')"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Build frontend
echo "Building frontend application..."
cd frontend

# Clean npm cache and node_modules to ensure fresh installation
echo "Cleaning up npm cache and node_modules..."
npm cache clean --force || true
rm -rf node_modules || true

# Install all required dependencies with exact versions
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Create simplified Vite config that bundles everything
echo "Creating optimized Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    assetsInlineLimit: 4096,
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit', 'redux-persist']
  }
});
EOL

# Run the build
echo "Building frontend with Vite..."
npm run build

cd ..

# Verify the build
echo "Verifying frontend build..."
if [ -d "frontend/dist" ]; then
    echo "Frontend build successful."
    
    # Create static directory if it doesn't exist
    mkdir -p backend/static
    
    # Copy frontend build to static directory
    echo "Copying frontend build to backend/static..."
    cp -r frontend/dist/* backend/static/
    
    echo "Frontend build deployed to static directory."
else
    echo "WARNING: Frontend build directory not found. Build failed."
    exit 1
fi

# Create a test HTML file to verify static file serving
echo "Creating test.html in static directory..."
cat > backend/static/test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe Test Page</title>
</head>
<body>
    <h1>Harmonic Universe Test Page</h1>
    <p>If you can see this, static file serving is working!</p>
</body>
</html>
EOL

# Set up database if needed
echo "Setting up database..."
cd backend
python init_migrations.py || echo "Warning: Database initialization failed, continuing anyway"
cd ..

echo "Build process complete." 