#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           COMPREHENSIVE BUILD ISSUES FIX SCRIPT          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Function to find and kill npm and node processes
kill_node_processes() {
  echo "🔍 Checking for running npm processes..."
  local npm_processes=$(ps aux | grep npm | grep -v grep | awk '{print $2}')
  local node_processes=$(ps aux | grep node | grep -v grep | awk '{print $2}')

  if [ ! -z "$npm_processes" ]; then
    echo "🛑 Killing npm processes: $npm_processes"
    kill -9 $npm_processes 2>/dev/null || true
  else
    echo "✅ No npm processes found."
  fi

  if [ ! -z "$node_processes" ]; then
    echo "🛑 Killing node processes: $node_processes"
    kill -9 $node_processes 2>/dev/null || true
  else
    echo "✅ No node processes found."
  fi

  echo "⏳ Waiting for processes to terminate..."
  sleep 2
}

# Function to clear npm cache
clear_npm_cache() {
  echo "🧹 Clearing npm cache..."
  npm cache clean --force || true
  echo "✅ npm cache cleared."
}

# Step 1: Check if we're in the project root
if [ ! -d "./frontend" ] || [ ! -d "./backend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

# Step 2: Kill any running npm and node processes
kill_node_processes

# Step 3: Clean up frontend
echo "🧹 Cleaning up frontend installation..."
cd frontend

# Force remove problematic directories
echo "🗑️  Removing node_modules directory..."
rm -rf node_modules/ || true

echo "🗑️  Removing package-lock.json..."
rm -f package-lock.json || true

echo "🗑️  Removing dist directory..."
rm -rf dist/ || true

echo "🗑️  Removing .vite directory..."
rm -rf .vite/ || true

# Clear npm cache
clear_npm_cache

# Step 4: Update Vite configuration to fix proxy issues
echo "🔧 Updating Vite configuration to fix proxy issues..."
cat > vite.config.js << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        ws: true,
        configure: (proxy, _options) => {
          proxy.on('error', (err, _req, _res) => {
            console.log('Proxy error:', err);
          });
          proxy.on('proxyReq', (proxyReq, req, _res) => {
            console.log('Proxying:', req.method, req.url);
          });
        }
      }
    }
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', '@reduxjs/toolkit', 'react-redux'],
        }
      }
    },
  }
});
EOF

# Step 5: Fix package.json to ensure script compatibility
echo "🔧 Ensuring package.json has proper scripts..."
# Check if jq is installed
if command -v jq &> /dev/null; then
  # Create a backup of package.json
  cp package.json package.json.bak
  # Use jq to ensure start script exists and update scripts
  jq '.scripts.start = "vite" | .scripts.dev = "vite" | .scripts["render-build"] = "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true NODE_ENV=production npx vite@4.5.1 build --mode production --emptyOutDir"' package.json > package.json.tmp
  mv package.json.tmp package.json
else
  # Manual update if jq is not available
  echo "⚠️ jq not found, using alternative method to update package.json..."
  # Check if start script already exists
  if ! grep -q '"start":' package.json; then
    sed -i.tmp '/"dev": /a\    "start": "vite",' package.json
    rm -f package.json.tmp
  fi
  # Update render-build script
  sed -i.tmp 's/"render-build": .*/"render-build": "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true NODE_ENV=production npx vite@4.5.1 build --mode production --emptyOutDir",/' package.json
  rm -f package.json.tmp
fi

# Step 6: Clean installation with explicit flags
echo "📦 Installing dependencies with explicit flags..."
npm install --legacy-peer-deps --no-fund --no-audit --prefer-offline

# Step 7: Explicitly install critical dependencies
echo "📦 Installing critical dependencies..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react-router-dom@6.20.0 @reduxjs/toolkit@1.9.7 react-redux@8.1.3 rollup@3.29.4 --legacy-peer-deps --ignore-scripts

# Step 8: Back to project root
cd ..

# Step 9: Fix Rollup and ESM compatibility issues by creating a Vite fix script
echo "🔧 Creating Vite build fix script..."
cat > fix-vite-build.sh << EOF
#!/bin/bash
set -e

echo "🔧 Setting up environment variables..."
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export VITE_SKIP_ROLLUP_NATIVE=true
export VITE_PURE_JS=true
export VITE_FORCE_ESM=true

echo "📂 Changing to frontend directory..."
cd frontend

echo "🔧 Creating CommonJS compatible build script..."
cat > vite-build.cjs << 'EOFSCRIPT'
// CommonJS build script
const path = require('path');
console.log('Starting programmatic Vite build (CommonJS)...');
try {
  // Attempt to require Vite
  const vite = require('vite');
  console.log('Vite module loaded successfully in CommonJS');

  // Run the build
  vite.build({
    configFile: path.resolve(__dirname, 'vite.config.js'),
    mode: 'production',
    emptyOutDir: true
  }).catch(err => {
    console.error('Build error:', err);
    process.exit(1);
  });
} catch (err) {
  console.error('Failed to load Vite module:', err);
  process.exit(1);
}
EOFSCRIPT

echo "🔧 Creating ES Module compatible build script..."
cat > vite-build.mjs << 'EOFSCRIPT'
// ES Module build script
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

console.log('Starting programmatic Vite build (ES Module)...');

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

async function runBuild() {
  try {
    // Dynamic import for ES modules
    const vite = await import('vite');
    console.log('Vite module loaded successfully in ES Module');

    // Run the build
    await vite.build({
      configFile: resolve(__dirname, 'vite.config.js'),
      mode: 'production',
      emptyOutDir: true
    });
  } catch (err) {
    console.error('Build error:', err);
    process.exit(1);
  }
}

runBuild();
EOFSCRIPT

echo "🧪 Testing build with CommonJS approach..."
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true npx vite@4.5.1 build --mode production || echo "Will try alternative methods later..."

echo "📂 Going back to project root..."
cd ..

chmod +x fix-vite-build.sh
EOF

chmod +x fix-vite-build.sh

# Step 10: Fix backend startup script to ensure it's ready for proxy
echo "🔧 Creating backend development startup script..."
cat > start-backend-dev.sh << EOF
#!/bin/bash
set -e

echo "📂 Changing to backend directory..."
cd backend

echo "🔧 Installing backend dependencies..."
python -m pip install -r requirements.txt

echo "🚀 Starting backend server..."
python app.py
EOF

chmod +x start-backend-dev.sh

# Step 11: Create a combined dev startup script
echo "🔧 Creating combined dev startup script..."
cat > start-dev.sh << EOF
#!/bin/bash

echo "🚀 Starting backend and frontend..."
# Start backend in the background
./start-backend-dev.sh &
BACKEND_PID=\$!

# Give backend a moment to start
sleep 2

# Start frontend
cd frontend && npm run dev

# When frontend stops, kill the backend
kill \$BACKEND_PID
EOF

chmod +x start-dev.sh

echo "✅ All fixes have been applied!"
echo "🚀 To start development with both frontend and backend:"
echo "   ./start-dev.sh"
echo ""
echo "🏁 To build for production deployment:"
echo "   chmod +x render-build-command.sh && ./render-build-command.sh"
echo ""
echo "🧪 To run just the frontend in development mode:"
echo "   cd frontend && npm run dev"
echo ""
echo "🔧 If you encounter any issues with the build:"
echo "   ./fix-vite-build.sh"
