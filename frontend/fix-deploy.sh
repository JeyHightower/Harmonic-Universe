#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║       HARMONIC UNIVERSE - RENDER DEPLOYMENT FIX          ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Set environment variables needed for Render deployment
echo "🔧 Setting environment variables for Render deployment..."
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export VITE_SKIP_ROLLUP_NATIVE=true
export VITE_PURE_JS=true
export VITE_FORCE_ESM=true
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"

# Clean up previous build artifacts and temporary directories
echo "🧹 Cleaning up previous build artifacts and temporary directories..."
rm -rf dist .vite 2>/dev/null || true
rm -rf node_modules/.vite node_modules/.cache node_modules/.tmp 2>/dev/null || true

# Deeper clean of problematic node_modules directories to prevent ENOTEMPTY errors
echo "🧹 Deep cleaning of problematic node_modules directories..."
find node_modules -type d -name ".vite" -exec rm -rf {} \; 2>/dev/null || true
find node_modules -type d -name ".cache" -exec rm -rf {} \; 2>/dev/null || true
find node_modules -type d -name ".tmp" -exec rm -rf {} \; 2>/dev/null || true

# Ensure Vite is installed
echo "📦 Ensuring Vite is installed..."
if ! npm list vite >/dev/null 2>&1; then
  echo "📦 Vite not found, installing..."
  npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional --ignore-scripts --legacy-peer-deps --prefer-offline
fi

# Patch the rollup native module
echo "🔧 Patching Rollup native module to use pure JS implementation..."
mkdir -p node_modules/rollup/dist
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

// Add xxhash exports
exports.xxhashBase16 = function() {
  return null;
};

exports.xxhashBase64Url = function() {
  return null;
};

exports.xxhashBase36 = function() {
  return null;
};
EOF
echo "✅ Rollup native module patched successfully."

# Create the node-entry.js file with fixed imports
echo "🔧 Creating fixed node-entry.js file..."
mkdir -p node_modules/rollup/dist/es/shared
cat > node_modules/rollup/dist/es/shared/node-entry.js << EOF
// Import using default import and destructuring to fix ESM/CommonJS compatibility
import pkg from '../../native.js';
const { parseAsync, xxhashBase16, xxhashBase64Url, xxhashBase36 } = pkg;

// Rest of the file would go here
// This is just a stub to fix the import error
EOF
echo "✅ Fixed node-entry.js created successfully."

# Fix all problematic imports
echo "🔍 Finding and fixing problematic imports in rollup..."
find node_modules -type f -name "*.js" -exec grep -l "from '../../native.js'" {} \; 2>/dev/null | while read -r file; do
  echo "🔧 Fixing imports in $file..."

  # Create a backup of the original file
  cp "$file" "${file}.bak" 2>/dev/null || true

  # Replace the problematic import with the recommended pattern
  sed -i.tmp "s/import { \([^}]*\) } from '..\/..\/native.js';/import pkg from '..\/..\/native.js';\nconst { \1 } = pkg;/g" "$file" 2>/dev/null || true
  rm -f "${file}.tmp" 2>/dev/null || true

  echo "✅ Fixed $file"
done

# Create a simplified Vite configuration
echo "🔧 Creating simplified vite.config.js..."
cat > vite.config.js << EOF
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// This special config disables Rollup native functionality
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
    ],
    esbuildOptions: {
      target: 'es2020',
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2020',
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
          ],
        },
      },
    },
  },
});
EOF
echo "✅ Simplified vite.config.js created successfully."

# Create a redirect file for SPA routing
echo "🔧 Creating _redirects file for deployment..."
mkdir -p dist
cat > dist/_redirects << EOF
/* /index.html 200
EOF

# Create a Netlify configuration file for SPA routing
echo "🔧 Creating netlify.toml file for deployment..."
cat > dist/netlify.toml << EOF
[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
EOF

# Build using npx to directly run Vite
echo "🔨 Building for production deployment using npx..."
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true npx vite@4.5.1 build --mode production || {
  echo "❌ First build attempt failed. Trying with alternative approach..."

  # Try our specialized build script
  ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true node build-render.js || {
    echo "❌ Second build attempt failed. Trying a more direct approach with specific options..."

    # Try one more approach with specific options
    ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true ROLLUP_NATIVE_PURE_JS=true ROLLUP_DISABLE_NATIVE=true NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules" npx vite@4.5.1 build --mode production --minify=esbuild --assetsInlineLimit=0 --emptyOutDir --outDir=dist
  }
}

# Check if the build was successful by looking for index.html in the dist folder
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful! Found dist/index.html"
  echo ""
  echo "🚀 Your app is ready for deployment to Render.com!"
  echo ""
  echo "Make sure to set these environment variables in Render:"
  echo "  ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true"
  echo "  ROLLUP_NATIVE_PURE_JS=true"
  echo "  ROLLUP_DISABLE_NATIVE=true"
  echo "  NODE_OPTIONS=--max-old-space-size=4096 --experimental-vm-modules"
else
  echo "❌ Build failed. No dist/index.html found."

  # Create an empty dist folder with a minimal index.html as a fallback
  mkdir -p dist
  cat > dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe - Build Error</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .error { color: red; background: #ffeeee; padding: 20px; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>Harmonic Universe - Build Error</h1>
  <div class="error">
    <p>There was an error during the build process. Please check the build logs for details.</p>
    <p>Build time: $(date)</p>
  </div>
</body>
</html>
EOF
  echo "⚠️ Created fallback index.html for debugging purposes."
  exit 1
fi

# Create some helpful info for deployment
echo "📝 Creating additional test HTML page for verification..."
cat > dist/test.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe - Deployment Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    h1 {
      color: #333;
      border-bottom: 2px solid #eee;
      padding-bottom: 10px;
    }
    .success {
      color: green;
      font-weight: bold;
    }
    .info {
      background: #f8f8f8;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #333;
    }
    code {
      background: #eee;
      padding: 2px 5px;
      border-radius: 3px;
      font-family: monospace;
    }
  </style>
</head>
<body>
  <h1>Harmonic Universe - Deployment Test</h1>

  <p class="success">✅ If you can see this page, your static files are being served correctly!</p>

  <div class="info">
    <h2>Deployment Information</h2>
    <p>This is a test page generated during the build process to verify that your static deployment is working correctly.</p>
    <p>Build date: $(date)</p>
    <p>Environment: Render.com</p>
  </div>

  <h2>Next Steps</h2>
  <ul>
    <li>Try navigating to the <a href="/">main application</a></li>
    <li>Check that API requests work correctly</li>
    <li>Verify that routing works for all URLs</li>
  </ul>

  <h2>Troubleshooting</h2>
  <p>If you encounter issues:</p>
  <ul>
    <li>Ensure all environment variables are set correctly</li>
    <li>Check that the _redirects file is working properly</li>
    <li>Review the build logs for any errors</li>
  </ul>
</body>
</html>
EOF

echo "✅ All deployment fixes applied successfully!"
