#!/bin/bash
set -e

# Harmonic Universe Render.com Deployment Script
# This script is the main entry point for deploying the full application on Render.com

echo "╔══════════════════════════════════════════════════════════╗"
echo "║               HARMONIC UNIVERSE DEPLOYMENT               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Get the project root directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR"

# Set environment variables
export NODE_VERSION=${NODE_VERSION:-18.17.0}
export PYTHON_VERSION=${PYTHON_VERSION:-3.9.6}
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_APP=${FLASK_APP:-app}
export PYTHONPATH="${PYTHONPATH}:${ROOT_DIR}:${ROOT_DIR}/backend"
export CI=false

echo "🔧 Environment Setup:"
echo "NODE_VERSION: $NODE_VERSION"
echo "PYTHON_VERSION: $PYTHON_VERSION"
echo "FLASK_ENV: $FLASK_ENV"
echo "FLASK_APP: $FLASK_APP"
echo "PYTHONPATH: $PYTHONPATH"
echo ""

# Step 1: Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ROOT_DIR/backend"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install gunicorn

# Step 2: Build and install frontend
echo "🏗️ Building frontend..."
cd "$ROOT_DIR/frontend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Install frontend dependencies and build
npm install
npm run render-build

# Step 3: Prepare static files for Flask
echo "📁 Preparing static files..."
cd "$ROOT_DIR"
mkdir -p static
cp -r frontend/dist/* static/ 2>/dev/null || echo "⚠️ No frontend build output found in dist/"

# Copy any required polyfills or additional files
if [ -d "frontend/public" ]; then
    for file in frontend/public/*.js frontend/public/*.ico; do
        if [ -f "$file" ]; then
            cp "$file" static/ 2>/dev/null || echo "⚠️ Could not copy $file"
        fi
    done
fi

# Step 4: Run any additional setup scripts
echo "🔄 Running backend setup scripts..."
cd "$ROOT_DIR/backend"
python -m scripts.copy_react_polyfill 2>/dev/null || echo "⚠️ Could not run polyfill script"

# Step 5: Verify the application is ready to start
echo "✅ Deployment setup complete!"
echo ""
echo "To start the application, run:"
echo "cd $ROOT_DIR/backend && gunicorn --workers=2 --timeout=120 wsgi:app"
echo ""
echo "For development use:"
echo "cd $ROOT_DIR && npm start"

# If this is running on Render.com, the startCommand from render.yaml will be used
# so this script should exit successfully to allow Render to proceed
exit 0
