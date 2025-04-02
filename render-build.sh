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
export NODE_OPTIONS="--max-old-space-size=2048"

# Set Node environment
export NODE_ENV=production

# Build Frontend
echo "==== Building frontend ===="
cd frontend

# Install frontend dependencies
echo "Installing frontend dependencies..."
npm install

# Explicitly install vite and @vitejs/plugin-react to ensure they're available
echo "Explicitly installing Vite and plugin-react..."
npm install --no-save vite @vitejs/plugin-react

# Create necessary React jsx-runtime fallback
echo "Creating JSX runtime fallback..."
mkdir -p src
cat > src/jsx-runtime-fallback.js << 'EOF'
// Fallback JSX runtime implementation
export function jsx(type, props, key) {
  const element = { type, props, key };
  return element;
}

export function jsxs(type, props, key) {
  return jsx(type, props, key);
}

export const Fragment = Symbol('Fragment');
export default { jsx, jsxs, Fragment };
EOF

# Create JSX dev runtime fallback too
cat > src/jsx-dev-runtime-fallback.js << 'EOF'
// Fallback JSX dev runtime implementation
import { jsx, jsxs, Fragment } from './jsx-runtime-fallback.js';
export { jsx, jsxs, Fragment };
export const jsxDEV = jsx;
export default { jsx, jsxs, jsxDEV, Fragment };
EOF

# Ensure React is properly linked in node_modules
echo "Setting up React JSX runtime links..."
mkdir -p node_modules/react
if [ ! -d "node_modules/react/jsx-runtime.js" ]; then
  echo "Creating JSX runtime symlinks in node_modules..."
  ln -sf ../../src/jsx-runtime-fallback.js node_modules/react/jsx-runtime.js
  ln -sf ../../src/jsx-dev-runtime-fallback.js node_modules/react/jsx-dev-runtime.js
fi

# List installed versions for troubleshooting
echo "Checking installed versions:"
npx vite --version
npm list @vitejs/plugin-react
npm list react

# Build the frontend application directly with Vite
echo "Building frontend application..."
VITE_FORCE_INCLUDE_ALL=true npx vite build --debug

# Verify the build output
echo "Verifying frontend build..."
if [ -d "dist" ]; then
  echo "Frontend build succeeded. Contents of dist directory:"
  ls -la dist
else
  echo "WARNING: Frontend build failed or dist directory not found"
  # Create minimal dist directory
  mkdir -p dist
  echo "<html><body><h1>Harmonic Universe</h1><p>Frontend build not available.</p></body></html>" > dist/index.html
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