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

# Install dependencies
echo "Installing dependencies..."
npm install

# Make sure redux-persist is properly installed and accessible
echo "Ensuring redux-persist is properly installed..."
npm install redux-persist@latest --save

# Build the frontend with CI=false to ignore warnings
echo "Building frontend application..."
CI=false npm run build

# Go back to the root directory
cd ..

# Create a static directory in both places to ensure it's found
echo "Setting up static directories..."
mkdir -p static
mkdir -p backend/static

# Copy the built frontend to both static directories
echo "Copying built frontend to static directories..."
cp -r frontend/dist/* static/
cp -r frontend/dist/* backend/static/

# Create _redirects file for SPA routing
echo "/* /index.html 200" > static/_redirects
echo "/* /index.html 200" > backend/static/_redirects

# Set up database if needed
echo "Setting up database..."
cd backend
python init_migrations.py || echo "Warning: Database initialization failed, continuing anyway"
cd ..

echo "Build process completed successfully" 