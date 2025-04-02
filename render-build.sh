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
rm -rf dist || true

# Install all required dependencies with exact versions
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Make sure react-router-dom is installed specifically
echo "Ensuring react-router-dom is installed..."
npm install --save react-router-dom@6.10.0 --legacy-peer-deps

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
    emptyOutDir: true,
    target: 'es2018',
    cssCodeSplit: true,
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      external: ['react-router-dom', 'react-redux', '@reduxjs/toolkit', 'redux-persist'],
      output: {
        globals: {
          'react-router-dom': 'ReactRouterDOM',
          'react-redux': 'ReactRedux',
          '@reduxjs/toolkit': 'RTK',
          'redux-persist': 'ReduxPersist'
        },
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor';
          }
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      'react-router-dom': resolve(__dirname, 'node_modules/react-router-dom'),
      'react-redux': resolve(__dirname, 'node_modules/react-redux'),
      '@reduxjs/toolkit': resolve(__dirname, 'node_modules/@reduxjs/toolkit'),
      'redux-persist': resolve(__dirname, 'node_modules/redux-persist')
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'react-redux', '@reduxjs/toolkit', 'redux-persist']
  }
});
EOL

# Create an HTML file that includes the external dependencies
echo "Creating an HTML file with external dependencies..."
cat > public/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <script src="https://unpkg.com/react@18.2.0/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18.2.0/umd/react-dom.production.min.js"></script>
  <script src="https://unpkg.com/react-router-dom@6.10.0/dist/umd/react-router-dom.production.min.js"></script>
  <script src="https://unpkg.com/react-redux@8.0.5/dist/react-redux.min.js"></script>
  <script src="https://unpkg.com/@reduxjs/toolkit@1.9.5/dist/redux-toolkit.umd.min.js"></script>
  <script src="https://unpkg.com/redux-persist@6.0.0/dist/redux-persist.min.js"></script>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOL

# Run the build
echo "Building frontend with Vite..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build || {
  echo "Build failed with normal Vite config, trying with direct CLI..."
  NODE_OPTIONS=--max-old-space-size=4096 npx vite build
}

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
    echo "WARNING: Frontend build directory not found. Creating fallback HTML..."
    mkdir -p backend/static
    cat > backend/static/index.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>The application is running in API-only mode due to frontend build issues.</p>
    <p>The API should still be accessible at /api endpoints.</p>
</body>
</html>
EOL
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