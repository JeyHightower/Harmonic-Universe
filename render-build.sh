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

# Clean node_modules and dist to ensure a fresh install
echo "Cleaning up node_modules and dist..."
rm -rf node_modules dist

# Ensure package.json exists and has proper configuration
if [ ! -f "package.json" ]; then
    echo "Missing package.json, initializing..."
    npm init -y
fi

# Install frontend dependencies explicitly
echo "Installing frontend dependencies..."
npm install --legacy-peer-deps

# Make sure all required dependencies are installed
echo "Installing critical dependencies directly..."
npm install prop-types react-redux react-router-dom --save --legacy-peer-deps

# Create a simpler Vite config that bundles everything
echo "Creating optimized Vite config..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    minify: true,
    // Ensure all dependencies are bundled, not externalized
    rollupOptions: {
      external: []
    }
  },
  // Ensure node_modules are properly scanned
  optimizeDeps: {
    include: ['react-redux', 'react-router-dom', 'prop-types']
  }
});
EOL

# Run the build with increased memory limit
echo "Building frontend with Vite..."
NODE_OPTIONS=--max-old-space-size=4096 npm run build

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