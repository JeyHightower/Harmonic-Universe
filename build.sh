#!/usr/bin/env bash
# exit on error
set -o errexit

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Set up Node.js environment
echo "Setting up Node.js environment..."
export NODE_OPTIONS="--max-old-space-size=4096"
export NODE_ENV=production

echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python -V)"

# Install Python dependencies
echo "===== INSTALLING PYTHON DEPENDENCIES ====="
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Prepare directory structure
echo "===== PREPARING DIRECTORY STRUCTURE ====="
mkdir -p static

# Set up and build frontend
echo "===== SETTING UP FRONTEND ====="
cd frontend

# Clean up existing installations
echo "Cleaning up previous installations..."
rm -rf node_modules package-lock.json .vite dist

# Install dependencies
echo "Installing dependencies..."
npm install

# Build frontend
echo "Building frontend..."
VITE_BUILD_MODE=production npm run build

# Verify build output
if [ ! -d "../static" ]; then
    echo "Error: Build failed - static directory not created"
    exit 1
fi

# Create version info
echo "===== CREATING VERSION INFO ====="
echo "{\"version\": \"1.0.0\", \"buildDate\": \"$(date)\"}" > ../static/build-info.json

echo "===== BUILD PROCESS COMPLETE ====="
echo "Final static directory contents:"
ls -la ../static/

# Collect static files
cd ../backend
python manage.py collectstatic --no-input

# Run migrations
python manage.py migrate

# Exit successfully
exit 0
