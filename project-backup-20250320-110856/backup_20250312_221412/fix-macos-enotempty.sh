#!/bin/bash

# Enhanced script to fix ENOTEMPTY errors specifically on macOS
# This is a more aggressive approach than the previous scripts

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          AGGRESSIVE MACOS ENOTEMPTY FIXER                ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Force kill ALL node and npm processes
echo "🔄 Force terminating ALL node and npm processes..."
killall -9 node npm 2>/dev/null || true
sleep 2

# Remove node_modules completely
echo "🧹 Nuclear approach: Completely removing node_modules..."
rm -rf node_modules
rm -rf frontend/node_modules

# Remove npm cache completely
echo "🧹 Clearing entire npm cache..."
npm cache clean --force

# Remove package-lock files
echo "🧹 Removing package lock files..."
rm -f package-lock.json
rm -f frontend/package-lock.json

# Create a very strict .npmrc
echo "📝 Creating strict .npmrc file..."
cat > frontend/.npmrc << EOL
fund=false
audit=false
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
loglevel=error
prefer-offline=false
legacy-peer-deps=true
unsafe-perm=true
force=true
no-package-lock=true
registry=https://registry.npmjs.org/
EOL

# Install dependencies with specific flags to avoid ENOTEMPTY
echo "📦 Installing only essential dependencies one-by-one..."
cd frontend

# First, install vite separately
echo "📦 Installing Vite..."
npm install --no-save vite@4.5.1 --no-fund --no-audit --ignore-scripts --force

# Install react core
echo "📦 Installing React core..."
npm install --no-save react@18.2.0 react-dom@18.2.0 --no-fund --no-audit --ignore-scripts --force

# Install plugin-react
echo "📦 Installing Vite React plugin..."
npm install --no-save @vitejs/plugin-react@4.2.1 --no-fund --no-audit --ignore-scripts --force

# Install Express
echo "📦 Installing Express..."
npm install express --save --no-fund --no-audit --ignore-scripts --force

echo "✅ MacOS ENOTEMPTY fix completed!"
echo "🔔 Try building now with: cd frontend && npm run build"
