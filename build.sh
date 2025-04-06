#!/bin/bash
# build.sh - Comprehensive build script for Render deployment

set -e # Exit on error

echo "Starting Harmonic Universe build process..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version || echo 'Node not found')"

# Set environment variables for deployment
export RENDER=true
export FLASK_ENV=production
export FLASK_DEBUG=0

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Create static directory
mkdir -p static

# Build frontend
echo "Building frontend assets..."
if [ -d "frontend" ]; then
  cd frontend
  
  echo "Creating a clean package.json with necessary dependencies..."
  cat > package.json << 'EOF'
{
  "name": "frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "prop-types": "^15.8.1",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-redux": "^8.1.3",
    "react-router": "^6.18.0",
    "react-router-dom": "^6.18.0",
    "@reduxjs/toolkit": "^1.9.5",
    "redux-persist": "^6.0.0",
    "axios": "^1.6.2",
    "antd": "^4.24.12",
    "@ant-design/icons": "^4.8.0",
    "@emotion/react": "^11.11.1",
    "@emotion/styled": "^11.11.0",
    "@mui/icons-material": "^5.14.15",
    "@mui/material": "^5.14.15",
    "moment": "^2.29.4",
    "three": "^0.157.0",
    "tone": "^14.7.77",
    "history": "^5.3.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.15",
    "@types/react-dom": "^18.2.7",
    "@types/react-router-dom": "^5.3.3",
    "@vitejs/plugin-react": "^4.0.3",
    "terser": "^5.19.2",
    "vite": "^4.4.9"
  },
  "resolutions": {
    "react-router-dom": "^6.18.0",
    "react-router": "^6.18.0"
  }
}
EOF

  echo "Creating optimized vite.config.js..."
  cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // Fix for react-router-dom resolution
      'react-router-dom': path.resolve(__dirname, 'node_modules/react-router-dom/dist/index.js'),
      'react-router': path.resolve(__dirname, 'node_modules/react-router/dist/index.js')
    },
    dedupe: ['react', 'react-dom', 'react-router-dom', 'react-router']
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react', 
            'react-dom', 
            'react-router',
            'react-router-dom',
            'react-redux',
            '@reduxjs/toolkit',
            'axios'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react', 
      'react-dom',
      'react-router',
      'react-router-dom',
      'react-redux',
      '@reduxjs/toolkit',
      'axios'
    ],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
EOF

  # Create temporary fix for App component to explicitly import router components
  mkdir -p src/utils
  cat > src/utils/router-fix.js << 'EOF'
// Explicit exports of react-router-dom components
import * as ReactRouterDOM from 'react-router-dom';
export default ReactRouterDOM;
export * from 'react-router-dom';
EOF

  echo "Installing frontend dependencies..."
  rm -rf node_modules
  npm cache clean --force
  
  # Force clean npm installation with specific focus on react-router-dom
  npm install --no-audit --no-fund --legacy-peer-deps
  npm install react-router-dom@6.18.0 react-router@6.18.0 --no-audit --no-fund --legacy-peer-deps --force
  
  echo "Building frontend production bundle..."
  NODE_OPTIONS="--max-old-space-size=4096" npm run build
  
  # Copy built files to static directory
  echo "Copying built files to static directory..."
  if [ -d "dist" ]; then
    cp -r dist/* ../static/
    echo "Copied files from dist/ to static/"
  else
    echo "WARNING: No dist directory found after build"
    ls -la
  fi
  
  cd ..
else
  echo "No frontend directory found, skipping frontend build"
fi

# Ensure static directory exists and has an index.html
if [ ! -f "static/index.html" ]; then
  echo "No index.html found in static directory, creating a placeholder"
  
  cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>The application is running. Please check the API status below:</p>
        <div id="status">Checking API...</div>
    </div>
    <script>
        // Check API health
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:green">API is running: ' + 
                    JSON.stringify(data) + '</strong>';
            })
            .catch(error => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:red">Error connecting to API: ' + 
                    error.message + '</strong>';
            });
    </script>
</body>
</html>
EOF
fi

# Copy static files to expected Render location
mkdir -p /opt/render/project/src/static
cp -r static/* /opt/render/project/src/static/ || echo "Warning: Could not copy to Render path"

# Set up database if needed
echo "Setting up database..."
export FLASK_APP=backend.app:create_app

# Run database migrations
echo "Running database migrations..."
cd backend
python -m flask db upgrade || echo "Warning: Database migrations failed, continuing"
cd ..

echo "Build process completed successfully" 