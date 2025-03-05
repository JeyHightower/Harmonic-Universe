#!/bin/bash
set -e

# Unified script for Render.com deployment

echo "====== HARMONIC UNIVERSE DEPLOYMENT ======"
echo "Starting deployment process on Render.com"
echo "Current directory: $(pwd)"

# Check for required environment variables
echo "Checking environment variables..."
if [ -z "$PORT" ]; then
  echo "WARNING: PORT environment variable is not set. Using default port 10000."
  export PORT=10000
fi

echo "Using PORT: $PORT"
export RENDER=true

# Install backend dependencies
echo "Installing Python dependencies..."
cd /opt/render/project/src
pip install -r requirements.txt

# Install and build frontend
echo "Building frontend..."
cd /opt/render/project/src/frontend
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
RENDER=true npm install
node scripts/render-build.js

# Start the server - bind to the PORT environment variable
echo "Starting Gunicorn server..."
cd /opt/render/project/src
echo "Setting PYTHONPATH to: $(pwd)"
export PYTHONPATH=$(pwd)

exec gunicorn backend.app.main:app \
  --bind 0.0.0.0:$PORT \
  --log-level debug \
  --workers 2 \
  --timeout 120 \
  --access-logfile - \
  --error-logfile -
