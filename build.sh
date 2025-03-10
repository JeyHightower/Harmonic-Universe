#!/bin/bash
# build.sh - Comprehensive build process for Harmonic Universe
set -e  # Exit on error

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Set up Node.js environment
echo "==> Setting up Node.js environment"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python -V)"

# Install Python dependencies
echo "===== INSTALLING PYTHON DEPENDENCIES ====="
python -m pip install --upgrade pip
pip install -r requirements.txt

# Fix React CDN issues
echo "===== FIXING REACT CDN ISSUES ====="
chmod +x ./fix-react-cdn.sh
./fix-react-cdn.sh

# Prepare directory structure
echo "===== PREPARING DIRECTORY STRUCTURE ====="
mkdir -p static
mkdir -p static/react-fixes

# Set up and build frontend
echo "===== SETTING UP FRONTEND ====="
cd frontend

# Install dependencies
echo "===== INSTALLING FRONTEND DEPENDENCIES ====="
npm install --legacy-peer-deps

# Install Vite explicitly
echo "===== INSTALLING VITE ====="
npm install --save-dev vite@latest @vitejs/plugin-react@latest

# Build the frontend
echo "===== BUILDING FRONTEND ====="
npm run build

# Copy build files to static directory
echo "===== COPYING BUILD FILES ====="
cd ..
cp -r frontend/dist/* static/

# Copy React production files
echo "===== COPYING REACT PRODUCTION FILES ====="
cp frontend/node_modules/react/umd/react.production.min.js static/ || echo "Warning: Could not copy react.production.min.js"
cp frontend/node_modules/react-dom/umd/react-dom.production.min.js static/ || echo "Warning: Could not copy react-dom.production.min.js"

# Create version info
echo "===== CREATING VERSION INFO ====="
echo "{\"version\": \"1.0.0\", \"buildDate\": \"$(date)\"}" > static/build-info.json

# Create diagnostic script
echo "===== CREATING DIAGNOSTIC SCRIPT ====="
cat > static/runtime-diagnostics.js << 'EOF'
console.log('Runtime diagnostics loaded');
window.APP_VERSION = {
  buildDate: '$(date)',
  environment: 'production'
};
EOF

echo "===== BUILD PROCESS COMPLETE ====="
echo "Final static directory contents:"
ls -la static/

# Exit successfully
exit 0
