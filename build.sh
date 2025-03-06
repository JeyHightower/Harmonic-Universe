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
        # Check for both JS and CJS versions of the file
        if [ -f "scripts/clean-ant-icons.js" ]; then
            echo "🔧 Renaming clean-ant-icons.js to clean-ant-icons.cjs..."
            mv scripts/clean-ant-icons.js scripts/clean-ant-icons.cjs

            # Fix any references in package.json
            sed -i 's/clean-ant-icons\.js/clean-ant-icons.cjs/g' package.json
        fi

        # Now handle the .cjs file if it exists
        if [ -f "scripts/clean-ant-icons.cjs" ]; then
            echo "🔧 Ensuring clean-ant-icons.cjs uses CommonJS syntax..."

            # Create a backup
            cp scripts/clean-ant-icons.cjs scripts/clean-ant-icons.cjs.bak

            # Check if it's not already using CommonJS
            if grep -q "import.*from.*glob" scripts/clean-ant-icons.cjs; then
                echo "  Converting ES modules to CommonJS in clean-ant-icons.cjs"
                # First, replace imports with require statements
                sed -i 's/import fs from .*/const fs = require("fs");/g' scripts/clean-ant-icons.cjs
                sed -i 's/import path from .*/const path = require("path");/g' scripts/clean-ant-icons.cjs
                sed -i 's/import { fileURLToPath } from .*/\/\/ fileURLToPath not needed in CommonJS/g' scripts/clean-ant-icons.cjs
                sed -i 's/import { glob } from .*/const glob = require("glob");/g' scripts/clean-ant-icons.cjs

                # Remove __filename and __dirname conversion (not needed in CommonJS)
                sed -i 's/const __filename = fileURLToPath.*/\/\/ __filename and __dirname are available in CommonJS/g' scripts/clean-ant-icons.cjs
                sed -i 's/const __dirname = path.dirname.*/\/\/ __dirname is already available/g' scripts/clean-ant-icons.cjs
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
