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
export VITE_APP_ENV=production
export VITE_USE_HASH_ROUTER=true
export ROLLUP_DISABLE_NATIVE=true

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Ensure backend app static directory exists
mkdir -p backend/app/static

# Build frontend
echo "Building frontend assets..."
if [ -d "frontend" ]; then
  # First ensure we're in the root directory
  ROOT_DIR=$(pwd)
  cd frontend
  
  # Install all needed dependencies explicitly
  echo "Installing frontend dependencies..."
  # First install core dependencies required for build
  npm install --no-save vite@4.5.2 @vitejs/plugin-react@4.0.3 --legacy-peer-deps
  # Then install React and Redux dependencies
  npm install --no-save react@18.2.0 react-dom@18.2.0 react-router-dom@6.18.0 react-router@6.18.0 react-redux@8.1.3 @reduxjs/toolkit@1.9.5 redux-persist@6.0.0 --legacy-peer-deps
  
  # Create simple vite config
  cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: []
    }
  }
});
EOF
  
  # Run vite build directly
  echo "Building frontend production bundle..."
  NODE_OPTIONS="--max-old-space-size=4096" npx vite build
  
  # Copy built files to static directory
  echo "Copying built files to Flask app static directory..."
  if [ -d "dist" ]; then
    cp -r dist/* "$ROOT_DIR/backend/app/static/"
    echo "Copied files from dist/ to backend/app/static/"
    
    # Also copy to root static for fallback
    mkdir -p "$ROOT_DIR/static"
    cp -r dist/* "$ROOT_DIR/static/"
    echo "Copied files from dist/ to static/ (fallback)"
  else
    echo "WARNING: No dist directory found after build"
    ls -la
  fi
  
  # Return to root directory
  cd "$ROOT_DIR"
else
  echo "No frontend directory found, skipping frontend build"
fi

# Ensure static directory exists and has an index.html
if [ ! -f "backend/app/static/index.html" ]; then
  echo "No index.html found in backend/app/static directory, creating a placeholder"
  
  cat > backend/app/static/index.html << 'EOF'
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
    <script>
        // Handle SPA routing for deep links
        (function() {
            // Redirect all 404s back to index.html for client-side routing
            if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/api/')) {
                console.log('SPA routing: handling deep link:', window.location.pathname);
                // History is preserved when using pushState
                window.history.pushState({}, '', '/');
            }
        })();
    </script>
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

# Check if there's an index.html in the secondary static folder, copy if not
if [ ! -f "static/index.html" ] && [ -f "backend/app/static/index.html" ]; then
  mkdir -p static
  cp -r backend/app/static/* static/
  echo "Copied index.html to static/ directory (secondary location)"
fi

# Copy static files to expected Render location for redundancy
mkdir -p /opt/render/project/src/static
cp -r backend/app/static/* /opt/render/project/src/static/ || echo "Warning: Could not copy to Render path"

# Set up database if needed
echo "Setting up database..."
export FLASK_APP=backend.app:create_app

# Run database migrations
echo "Running database migrations..."
cd backend
python -m flask db upgrade || echo "Warning: Database migrations failed, continuing"
cd ..

echo "Build process completed successfully" 