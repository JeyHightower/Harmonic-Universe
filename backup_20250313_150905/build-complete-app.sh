#!/bin/bash

# Script to build the COMPLETE Harmonic Universe application - more aggressive approach
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║         BUILDING COMPLETE HARMONIC UNIVERSE APP           ║"
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

# Debug - list repository contents to see what we're working with
echo "📂 Repository contents:"
ls -la
echo "📂 Frontend directory contents:"
ls -la frontend/

# Change to frontend directory
cd frontend || exit 1
echo "Changed to frontend directory"

# Debug - dump current vite.config.js
echo "📄 Current vite.config.js:"
if [ -f "vite.config.js" ]; then
  cat vite.config.js
  # Backup original file
  cp vite.config.js vite.config.js.bak
else
  echo "No vite.config.js found!"
fi

# Debug - examine main entry point
echo "📄 Main entry point file:"
if [ -f "src/main.jsx" ]; then
  cat src/main.jsx
else
  echo "src/main.jsx not found!"
  echo "Searching for main entry file..."
  find src -name "*.jsx" -o -name "*.js" | grep -i "main\|index\|app"
fi

# Debug - examine App component
echo "📄 App component:"
if [ -f "src/App.jsx" ]; then
  cat src/App.jsx
else
  echo "src/App.jsx not found!"
  find src -name "App*"
fi

# Clean up problematic directories
echo "🧹 Cleaning up problematic directories..."
rm -rf node_modules/.vite node_modules/.cache node_modules/.tmp node_modules/@esbuild 2>/dev/null || true

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Create .npmrc file with appropriate settings
echo "📝 Creating .npmrc file..."
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
echo "📦 Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps --no-fund --no-optional --force --no-package-lock

# Install Express explicitly
echo "📦 Installing Express explicitly..."
npm install express --save

# Fix Rollup native module issues
echo "🔧 Fixing Rollup native module issues..."
if [ -f "node_modules/rollup/dist/es/shared/node-entry.js" ]; then
  echo "Patching node_modules/rollup/dist/es/shared/node-entry.js..."
  sed -i.bak 's/import { createRequire } from '\''module'\''/import module from '\''module'\''\nconst { createRequire } = module/g' node_modules/rollup/dist/es/shared/node-entry.js
  echo "✅ Fixed node_modules/rollup/dist/es/shared/node-entry.js"
fi

# Create a comprehensive vite.config.js that includes all your dependencies
echo "📝 Creating comprehensive vite.config.js..."
cat > vite.config.js << 'EOL'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'antd',
      '@ant-design/icons',
      'axios',
      'moment',
      'prop-types',
    ],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux',
            'antd',
          ],
          utils: [
            'axios',
            'moment',
            'prop-types',
          ],
        },
      },
    },
  },
});
EOL

# Create SPA routing file
echo "📝 Creating _redirects file for SPA routing..."
mkdir -p dist
cat > dist/_redirects << EOL
/*    /index.html   200
EOL

# Examine the package.json to see what the build command is
echo "📄 Package.json build command:"
grep -A 5 '"scripts"' package.json

# Check if src directory exists and has content
echo "📂 Checking src directory..."
if [ -d "src" ]; then
  echo "src directory exists, listing contents:"
  ls -la src/
else
  echo "src directory not found!"
  exit 1
fi

# Build the app
echo "🔨 Building the full application..."
npm run build

# Check if build succeeded
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful!"

  # Check the size of the build
  echo "📊 Build output size:"
  du -sh dist/
  echo "📊 Detailed file listing:"
  find dist -type f | sort
else
  echo "❌ Build failed. Creating a fallback index.html..."
  mkdir -p dist
  cat > dist/index.html << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(255, 255, 255, 0.1);
            border-radius: 10px;
            backdrop-filter: blur(10px);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
        }
        p {
            font-size: 1.2rem;
            margin-bottom: 2rem;
        }
        pre {
            text-align: left;
            background: rgba(0,0,0,0.2);
            padding: 1rem;
            border-radius: 5px;
            overflow: auto;
            max-height: 300px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Build process encountered issues. Showing debugging information:</p>
        <pre id="debug-info">
Build script failed to produce the full application.
Check the Render logs for more details.
        </pre>
    </div>
</body>
</html>
EOL
fi

echo "🚀 Deployment process completed!"
