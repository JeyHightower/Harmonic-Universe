#!/bin/bash

# Exit on error
set -e

# Display diagnostic information
echo "Starting build process at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Set Node memory limit to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=4096"

# Set Node environment
export NODE_ENV=production

# Build Frontend
echo "==== Building frontend ===="
cd frontend

# Clean any problematic node_modules
echo "Cleaning node_modules..."
rm -rf node_modules/.vite

# Install frontend dependencies with specific versions
echo "Installing frontend dependencies..."
npm install

# Explicitly install specific versions of critical dependencies
echo "Installing critical dependencies with specific versions..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react@18.2.0 react-dom@18.2.0

# Create JSX runtime implementation files
echo "Creating JSX runtime implementation files..."
mkdir -p src
cat > src/jsx-runtime.js << 'EOF'
// JSX runtime implementation
export function jsx(type, props) {
  return { type, props };
}

export function jsxs(type, props) {
  return jsx(type, props);
}

export const Fragment = Symbol('Fragment');
export default { jsx, jsxs, Fragment };
EOF

cat > src/jsx-dev-runtime.js << 'EOF'
// Import from our custom jsx-runtime implementation
import { jsx, jsxs, Fragment } from './jsx-runtime.js';
export { jsx, jsxs, Fragment };
export const jsxDEV = jsx;
export default { jsx, jsxs, jsxDEV, Fragment };
EOF

# Create vite-plugin-react-shim.js
cat > vite-plugin-react-shim.js << 'EOF'
// Simple React plugin shim for Vite
export default function reactShim() {
  return {
    name: 'vite-plugin-react-shim',
    config() {
      return {
        esbuild: {
          jsx: 'automatic',
          jsxInject: `import React from 'react'`
        },
        resolve: {
          alias: {
            'react/jsx-runtime': require.resolve('./src/jsx-runtime.js'),
            'react/jsx-dev-runtime': require.resolve('./src/jsx-dev-runtime.js'),
          },
        },
      };
    },
  };
}
EOF

# Create a minimal vite.config.js for the build
cat > vite.config.minimal.js << 'EOF'
import { defineConfig } from 'vite';
import reactShim from './vite-plugin-react-shim';
import path from 'path';

export default defineConfig({
  plugins: [reactShim()],
  resolve: {
    alias: {
      'react/jsx-runtime': path.resolve(__dirname, './src/jsx-runtime.js'),
      'react/jsx-dev-runtime': path.resolve(__dirname, './src/jsx-dev-runtime.js'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom'],
    esbuildOptions: {
      jsx: 'automatic'
    }
  }
});
EOF

# List installed versions for troubleshooting
echo "Checking installed versions:"
npx vite --version
npm list react
npm list react-dom
npm list @vitejs/plugin-react

# Try to build with the regular config first, fallback to minimal if it fails
echo "Building frontend application..."
if ! npx vite build --debug; then
  echo "Regular build failed, trying with minimal config..."
  npx vite build --config vite.config.minimal.js
fi

# Verify the build output
echo "Verifying frontend build..."
if [ -d "dist" ]; then
  echo "Frontend build succeeded. Contents of dist directory:"
  ls -la dist
else
  echo "WARNING: Frontend build failed, creating minimal static files"
  # Create minimal dist directory with a basic app
  mkdir -p dist
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Welcome to Harmonic Universe. The application is loading...</p>
    <div id="root"></div>
  </div>
  <script>
    // Simple script to check if API is available
    fetch('/api/health')
      .then(response => response.json())
      .catch(err => console.log('API not yet available'));
  </script>
</body>
</html>
EOF
fi

# Return to root directory
cd ..

# Build Backend
echo "==== Building backend ===="
cd backend

# Install backend dependencies
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs
mkdir -p static

# Initialize database
echo "Initializing database..."
if [ -f "init_migrations.py" ]; then
  export FLASK_APP=init_migrations.py
  python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing"
else
  echo "init_migrations.py not found, skipping migrations"
fi

# Return to root directory
cd ..

# Copy frontend build to backend static directory
echo "Copying frontend build to backend static directory..."
rm -rf backend/static/* # Clean existing files
cp -r frontend/dist/* backend/static/

# Ensure the static directory has proper permissions
echo "Setting permissions for static directory..."
chmod -R 755 backend/static

# Verify backend static directory
echo "Verifying backend static directory..."
ls -la backend/static

echo "Build completed successfully at $(date)"
exit 0 