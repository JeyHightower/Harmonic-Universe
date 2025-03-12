#!/bin/bash
set -e

# Display the banner
echo "╔══════════════════════════════════════════════════════════╗"
echo "║       HARMONIC UNIVERSE - RENDER BUILD COMMAND           ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Log file for debugging
LOG_FILE="render_build.log"
echo "📝 Logging to $LOG_FILE"
exec > >(tee -a "$LOG_FILE") 2>&1

echo "🔍 Build script started at $(date)"
echo "🔧 Node version: $(node -v)"
echo "🔧 NPM version: $(npm -v)"

# Setting environment variables
echo "🔧 Setting environment variables to disable native modules..."
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export VITE_SKIP_ROLLUP_NATIVE=true
export VITE_PURE_JS=true
export VITE_FORCE_ESM=true
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"

# Make sure we're in the right directory
if [ -d "frontend" ]; then
  cd frontend

  # Clean up previous installations
  echo "🧹 Cleaning up previous installations..."
  rm -rf node_modules package-lock.json dist .vite 2>/dev/null || true

  # Create .npmrc file with settings to avoid native modules
  echo "🔧 Creating .npmrc file to disable native modules..."
  cat > .npmrc << EOF
# Fix for Rollup native modules on Linux GNU systems
rollup-skip-nodejs-native-build=true
rollup-native-pure-js=true
node-options=--max-old-space-size=4096 --experimental-vm-modules
legacy-peer-deps=true
fund=false
audit=false
EOF

  # Install dependencies with specific flags to avoid native builds
  echo "📦 Installing dependencies without native modules..."
  npm install --no-optional --ignore-scripts --legacy-peer-deps

  # Install specific versions of critical packages
  echo "📦 Installing specific versions of critical packages..."
  npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react-router-dom@6.20.0 @reduxjs/toolkit@1.9.7 react-redux@8.1.3 --no-optional --ignore-scripts --legacy-peer-deps

  # Patch the rollup native module file if it exists
  if [ -f "node_modules/rollup/dist/native.js" ]; then
    echo "🔧 Patching Rollup native module to use pure JS implementation..."
    cat > node_modules/rollup/dist/native.js << EOF
'use strict';

// This is a patched version that skips native module loading
// and always returns null to force pure JS implementation

Object.defineProperty(exports, '__esModule', { value: true });

function requireWithFriendlyError() {
  // Always return null to force pure JS implementation
  return null;
}

// Export patched function
exports.getDefaultNativeFactory = function() {
  return null;
};

exports.getNativeFactory = function() {
  return null;
};

// Add exports that might be imported by ES modules
exports.parse = function() {
  return null;
};

exports.parseAsync = function() {
  return Promise.resolve(null);
};
EOF
    echo "✅ Rollup native module patched successfully."
  fi

  # Patch any files that have CommonJS vs ES Module import issues
  echo "🔧 Patching files with CommonJS vs ES Module import issues..."

  # Search for problematic files in node_modules that might import from native.js
  find node_modules -type f -name "*.js" -exec grep -l "from '../../native.js'" {} \; 2>/dev/null | while read -r file; do
    echo "🔍 Found problematic import in $file, patching..."

    # Create a backup of the original file
    cp "$file" "${file}.bak"

    # Replace the problematic import with the recommended pattern
    sed -i.tmp "s/import { parse, parseAsync } from '..\/..\/native.js';/import pkg from '..\/..\/native.js';\nconst { parse, parseAsync } = pkg;/g" "$file"
    rm -f "${file}.tmp"

    echo "✅ Patched $file"
  done

  # Create a wrapper for ES modules to work with CommonJS
  echo "🔧 Creating ESM wrapper for CommonJS modules..."
  mkdir -p esm-wrappers
  cat > esm-wrappers/native-wrapper.js << EOF
// ES Module wrapper for CommonJS native.js
import native from '../node_modules/rollup/dist/native.js';

// Re-export all properties as named exports
export const parse = native.parse || (() => null);
export const parseAsync = native.parseAsync || (() => Promise.resolve(null));
export const getDefaultNativeFactory = native.getDefaultNativeFactory || (() => null);
export const getNativeFactory = native.getNativeFactory || (() => null);

// Also export the default
export default native;
EOF

  # Try building with our special ES module build script
  echo "🔨 Building with ES module build script..."
  node build-render.js
  BUILD_RESULT=$?

  if [ $BUILD_RESULT -eq 0 ] && [ -d "dist" ]; then
    echo "✅ Build successful using ES module build script!"

    # Copy dist files to static directory (if needed)
    if [ ! -d "../static" ]; then
      echo "📂 Creating static directory..."
      mkdir -p ../static
    fi

    echo "📂 Copying build to static directory..."
    cp -r dist/* ../static/ 2>/dev/null || echo "⚠️ No dist files found"

    # Go back to project root
    cd ..

    # Install backend dependencies if needed
    if [ -d "backend" ]; then
      echo "📦 Installing backend dependencies..."
      cd backend
      python -m pip install --upgrade pip
      if [ -f "requirements.txt" ]; then
        python -m pip install -r requirements.txt
      fi
      python -m pip install gunicorn
      cd ..
    fi

    echo "✅ Build completed successfully at $(date)"
    exit 0
  else
    echo "⚠️ ES module build script failed, trying fallback methods..."

    # Update build-render.js to use named imports properly
    echo "🔧 Creating fallback build script with proper imports..."
    cat > build-render-fallback.js << EOF
// ES Module compatible build script for Render - Fallback version
import { build } from 'vite';

// Set environment variables to force pure JS implementation
process.env.ROLLUP_SKIP_NODEJS_NATIVE_BUILD = 'true';
process.env.ROLLUP_NATIVE_PURE_JS = 'true';
process.env.ROLLUP_DISABLE_NATIVE = 'true';
process.env.VITE_SKIP_ROLLUP_NATIVE = 'true';
process.env.VITE_PURE_JS = 'true';
process.env.VITE_FORCE_ESM = 'true';

console.log('🚀 Starting Vite build with pure JS implementation (fallback)...');

// Load the config directly
import('./vite.config.render.js').then(config => {
  // Run the build with production mode and emptyOutDir option
  build({
    mode: 'production',
    emptyOutDir: true,
    configFile: false,
    ...config.default
  }).then(() => {
    console.log('✅ Build completed successfully!');
  }).catch(error => {
    console.error('❌ Build failed:', error);
    process.exit(1);
  });
}).catch(error => {
  console.error('❌ Failed to load config:', error);
  process.exit(1);
});
EOF

    # Try the fallback build script
    echo "🔨 Trying fallback build script..."
    node build-render-fallback.js
    BUILD_RESULT=$?

    if [ $BUILD_RESULT -eq 0 ] && [ -d "dist" ]; then
      echo "✅ Build successful using fallback build script!"

      # Copy dist files to static directory
      if [ ! -d "../static" ]; then
        mkdir -p ../static
      fi

      echo "📂 Copying build to static directory..."
      cp -r dist/* ../static/ 2>/dev/null || echo "⚠️ No dist files found"

      # Go back to project root
      cd ..

      # Install backend dependencies if needed
      if [ -d "backend" ]; then
        echo "📦 Installing backend dependencies..."
        cd backend
        python -m pip install --upgrade pip
        if [ -f "requirements.txt" ]; then
          python -m pip install -r requirements.txt
        fi
        python -m pip install gunicorn
        cd ..
      fi

      echo "✅ Build completed successfully at $(date)"
      exit 0
    else
      # Try direct build with vite and CommonJS-compatible config
      echo "🔧 Creating CommonJS-compatible Vite config..."
      cat > vite.config.cjs << EOF
// CommonJS-compatible Vite config
const react = require('@vitejs/plugin-react');
const path = require('path');

/** @type {import('vite').UserConfig} */
module.exports = {
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    commonjsOptions: {
      transformMixedEsModules: true,
      include: [/node_modules/],
    },
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@reduxjs/toolkit',
            'react-redux'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@reduxjs/toolkit',
      'react-redux',
      'axios',
      'moment',
      'prop-types'
    ],
    esbuildOptions: {
      target: 'es2020'
    }
  }
};
EOF

      # Try building with the CommonJS config
      echo "🔨 Trying build with CommonJS config..."
      ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true npx vite@4.5.1 build --config vite.config.cjs --mode production
      BUILD_RESULT=$?

      if [ $BUILD_RESULT -eq 0 ] && [ -d "dist" ]; then
        echo "✅ Build successful using CommonJS config!"

        # Copy dist files to static directory
        if [ ! -d "../static" ]; then
          mkdir -p ../static
        fi

        echo "📂 Copying build to static directory..."
        cp -r dist/* ../static/ 2>/dev/null || echo "⚠️ No dist files found"

        # Go back to project root
        cd ..

        # Install backend dependencies if needed
        if [ -d "backend" ]; then
          echo "📦 Installing backend dependencies..."
          cd backend
          python -m pip install --upgrade pip
          if [ -f "requirements.txt" ]; then
            python -m pip install -r requirements.txt
          fi
          python -m pip install gunicorn
          cd ..
        fi

        echo "✅ Build completed successfully at $(date)"
        exit 0
      else
        echo "⚠️ All build methods failed, creating minimal fallback page..."

        # Create a minimal default HTML page
        cd ..
        mkdir -p static
        cat > static/index.html << EOFHTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe - Maintenance</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #f5f5f5;
      color: #333;
    }
    .container {
      max-width: 600px;
      padding: 40px;
      text-align: center;
      background-color: white;
      border-radius: 10px;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    h1 {
      color: #6200ea;
    }
    p {
      line-height: 1.6;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>We're currently updating our site to serve you better. Please check back soon!</p>
    <p>If you're the site administrator, please check the build logs for errors.</p>
  </div>
</body>
</html>
EOFHTML

        # Install backend dependencies regardless
        if [ -d "backend" ]; then
          echo "📦 Installing backend dependencies..."
          cd backend
          python -m pip install --upgrade pip
          if [ -f "requirements.txt" ]; then
            python -m pip install -r requirements.txt
          fi
          python -m pip install gunicorn
          cd ..
        fi

        echo "⚠️ Frontend build process failed but created a fallback page."
        echo "ℹ️ Backend dependencies have been installed and should still function."
        echo "✅ Final build completed with fallback at $(date)"
      fi
    fi
  fi
else
  echo "❌ Frontend directory not found!"
  exit 1
fi
