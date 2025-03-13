#!/bin/bash
set -e

# Ensure we're in the frontend directory
cd "$(dirname "$0")"

echo "🧹 Cleaning up..."
rm -rf node_modules dist ../static
mkdir -p ../static

echo "📦 Installing dependencies..."
npm install --no-audit

echo "🛠 Building the application..."
npm run build

echo "✨ Build completed!"
