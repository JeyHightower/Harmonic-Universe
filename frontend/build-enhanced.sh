#!/bin/bash
# Enhanced build script for the React frontend to fix dependency issues

set -e  # Exit on error

echo "Starting enhanced frontend build process..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version || echo 'Node not available')"
echo "NPM version: $(npm --version || echo 'NPM not available')"

# Clean up environment
echo "Cleaning up previous build artifacts..."
rm -rf dist
rm -rf node_modules

# Install dependencies with specific focus on react-router-dom
echo "Installing dependencies with explicit resolution..."
npm install --no-audit --no-fund --legacy-peer-deps
npm install react-router-dom@6.18.0 --no-audit --no-fund --legacy-peer-deps --force
npm install react-router@6.18.0 --no-audit --no-fund --legacy-peer-deps --force

# Create a temporary patch for the react-router-dom issue
echo "Creating temporary fix for react-router-dom resolution..."
mkdir -p patches
cat > patches/react-router-dom-fix.js << 'EOF'
// This is a temporary fix to ensure react-router-dom is properly imported
import * as ReactRouterDOM from 'react-router-dom';
export default ReactRouterDOM;
export * from 'react-router-dom';
EOF

# Create a temporary file with explicit imports
mkdir -p src/utils
cat > src/utils/router-fix.js << 'EOF'
// This file ensures all react-router-dom exports are explicitly available
import { 
  BrowserRouter, 
  Routes, 
  Route, 
  Link, 
  NavLink, 
  Navigate, 
  useNavigate, 
  useLocation,
  useParams,
  useSearchParams,
  Outlet
} from 'react-router-dom';

export {
  BrowserRouter, 
  Routes, 
  Route, 
  Link, 
  NavLink, 
  Navigate, 
  useNavigate, 
  useLocation,
  useParams,
  useSearchParams,
  Outlet
};
EOF

# Build with maximum node memory
echo "Building frontend with enhanced settings..."
NODE_OPTIONS="--max-old-space-size=4096" npm run build

# If the build succeeded with the dist folder, report success
if [ -d "dist" ]; then
  echo "✅ Enhanced build completed successfully! Output in dist/ directory."
  ls -la dist
else
  echo "❌ Build failed! No dist directory found."
  exit 1
fi 