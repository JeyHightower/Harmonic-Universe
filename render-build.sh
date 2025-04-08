#!/bin/bash

# Exit on error
set -e

# Echo commands as they're executed for better debugging
set -x

# Export Node options to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Check for frontend directory
if [ ! -d "frontend" ]; then
    echo "Frontend directory does not exist."
    exit 1
fi

# Install frontend dependencies and build
cd frontend
if [ -d "node_modules" ]; then
    echo "Cleaning previous node_modules installation..."
    rm -rf node_modules
fi

echo "Installing frontend dependencies..."
# Install dependencies in the correct location
echo "Installing npm packages directly in frontend directory..."
npm install --legacy-peer-deps --verbose

# Explicitly install critical dependencies
echo "Installing critical dependencies explicitly..."
npm install react react-dom react-redux @reduxjs/toolkit react-router-dom react-router vite@latest @vitejs/plugin-react --legacy-peer-deps --save

# Check if react-redux is installed properly
if ! npm list react-redux; then
  echo "react-redux installation failed, trying alternative approach..."
  npm install react-redux@8.1.3 --force --save
fi

# Create a temporary simplified vite.config.js to ensure build works
cat > vite.config.js.temp <<EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        'react-redux',
        'react',
        'react-dom',
        'react-router',
        'react-router-dom',
        '@reduxjs/toolkit'
      ]
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  }
});
EOL

# Make a backup of the original config
if [ -f "vite.config.js" ]; then
  cp vite.config.js vite.config.js.backup
fi

# Use the simplified config
echo "Using simplified vite config for build..."
cp vite.config.js.temp vite.config.js

# Set environment variables for the build
export CI=false
export VITE_APP_ENV=production

# Try to build with the simplified config
echo "Starting frontend build with simplified config..."
npm run build || {
    echo "Build failed. Attempting alternative build configuration..."
    
    # Create an even more minimal vite.config.js
    cat > vite.config.js <<EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    commonjsOptions: {
      include: [/node_modules/],
      extensions: ['.js', '.jsx']
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: undefined
      }
    }
  }
});
EOL
    
    # Try building with npx and the most basic config
    npx vite build --debug
}

# Restore original config if backup exists
if [ -f "vite.config.js.backup" ]; then
  mv vite.config.js.backup vite.config.js
fi

echo "Frontend build completed."

# Check for backend directory
if [ ! -d "../backend" ]; then
    echo "Backend directory does not exist."
    exit 1
fi

# Move to backend
cd ../backend

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt
pip install psycopg2 

# Run database migrations and seed data
echo "Running database migrations..."
flask db upgrade
echo "Seeding database..."
flask seed all

echo "Build completed successfully!" 