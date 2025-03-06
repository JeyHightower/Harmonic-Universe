#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting build process for Harmonic Universe"

# Install Python dependencies for backend
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure necessary directories exist
echo "📁 Creating necessary directories..."
mkdir -p static

# Setup frontend
if [ -d "frontend" ]; then
    echo "🌐 Setting up frontend..."
    cd frontend

    # Ensure glob is available
    echo "📦 Installing glob dependency..."
    npm install glob --save

    # Fix potential ESM issues with glob in any scripts
    if [ -d "scripts" ]; then
        echo "🔧 Checking for problematic scripts..."
        if [ -f "scripts/clean-ant-icons.js" ]; then
            echo "🔧 Fixing clean-ant-icons.js..."
            # Create a backup
            cp scripts/clean-ant-icons.js scripts/clean-ant-icons.js.bak

            # Check if it's using ES imports
            if grep -q "import.*from.*glob" scripts/clean-ant-icons.js; then
                echo "  Replacing ES modules import with CommonJS require"
                # Add require at the top
                sed -i '1i\const glob = require("glob");' scripts/clean-ant-icons.js
                # Comment out the ES import
                sed -i 's/import.*from.*glob.*/\/\/ ES import replaced with CommonJS require/' scripts/clean-ant-icons.js
            fi
        fi
    fi

    # Install all dependencies
    echo "📦 Installing all frontend dependencies..."
    npm ci || npm install

    # Build the frontend
    echo "🏗️ Building frontend..."
    npm run build

    # Move build files to static directory in the root for the API to serve
    echo "📦 Moving frontend build to static directory..."
    rm -rf ../static/*
    cp -r build/* ../static/

    cd ..
    echo "✅ Frontend setup completed"
else
    echo "⚠️ No frontend directory found, skipping frontend build"
fi

echo "✅ Build process completed successfully"
