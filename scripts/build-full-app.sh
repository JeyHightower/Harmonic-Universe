#!/bin/bash

# Script to build the full Harmonic Universe application while fixing ESM issues
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       BUILDING FULL HARMONIC UNIVERSE APPLICATION         ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Set environment variables
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"

# Install NVM if it's not already installed
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
fi

# Set up NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use the correct Node.js version
echo "Installing and using Node.js 18.19.0..."
nvm install 18.19.0
nvm use 18.19.0

# Check Node.js and npm versions
echo "Node.js version:"
node -v
echo "npm version:"
npm -v

# Change to frontend directory
cd frontend || exit 1
echo "Changed to frontend directory"

# Clean up problematic directories
echo "Cleaning up problematic directories..."
rm -rf node_modules/.vite node_modules/.cache node_modules/.tmp node_modules/@esbuild 2>/dev/null || true

# Clean npm cache
echo "Cleaning npm cache..."
npm cache clean --force

# Create .npmrc file with appropriate settings
echo "Creating .npmrc file..."
cat > .npmrc << EOL
fund=false
audit=false
loglevel=error
prefer-offline=false
legacy-peer-deps=true
unsafe-perm=true
force=true
no-package-lock=true
EOL

# Install dependencies
echo "Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps --no-fund --no-optional --force --no-package-lock

# Install Express explicitly
echo "Installing Express explicitly..."
npm install express --save

# Fix Rollup native module issues (patch only, don't replace configs)
echo "Fixing Rollup native module issues..."
if [ -f "node_modules/rollup/dist/es/shared/node-entry.js" ]; then
  echo "Patching node_modules/rollup/dist/es/shared/node-entry.js..."
  sed -i.bak 's/import { createRequire } from '\''module'\''/import module from '\''module'\''\nconst { createRequire } = module/g' node_modules/rollup/dist/es/shared/node-entry.js
  echo "✅ Fixed node_modules/rollup/dist/es/shared/node-entry.js"
fi

if [ -f "node_modules/rollup/dist/es/shared/node-entry.js.bak" ]; then
  rm node_modules/rollup/dist/es/shared/node-entry.js.bak
fi

# Create sane _redirects file for SPA routing
echo "Creating _redirects file for SPA routing..."
mkdir -p dist
cat > dist/_redirects << EOL
/*    /index.html   200
EOL

# Make sure vite.config.js exists but DON'T replace the existing one
if [ ! -f "vite.config.js" ]; then
  echo "Creating minimal vite.config.js (only because none exists)..."
  cat > vite.config.js << EOL
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
EOL
fi

# Build the app WITH your original configuration
echo "🔨 Building the full application..."
npm run build

# Check if build succeeded
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful! Full application built."
else
  echo "❌ Build failed. Check the logs above for errors."
  exit 1
fi

echo "🚀 Your full application is ready for deployment!"
