#!/bin/bash
set -e

echo "🚀 Starting build process..."

# Ensure we're in the frontend directory
cd "$(dirname "$0")"

# Clean up
echo "🧹 Cleaning up previous builds..."
rm -rf node_modules dist ../static
mkdir -p ../static

# Install dependencies
echo "📦 Installing dependencies..."
npm install --no-audit --prefer-offline

# Run build
echo "🛠 Building the application..."
npm run build

echo "✨ Build completed successfully!"
