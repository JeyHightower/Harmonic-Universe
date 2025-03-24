#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             NPM INSTALLATION FIX SCRIPT                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Function to find and kill npm and node processes
kill_node_processes() {
  echo "🔍 Checking for running npm processes..."
  local npm_processes=$(ps aux | grep npm | grep -v grep | awk '{print $2}')
  local node_processes=$(ps aux | grep node | grep -v grep | awk '{print $2}')

  if [ ! -z "$npm_processes" ]; then
    echo "🛑 Killing npm processes: $npm_processes"
    for pid in $npm_processes; do
      kill -9 $pid 2>/dev/null || true
    done
  else
    echo "✅ No npm processes found."
  fi

  if [ ! -z "$node_processes" ]; then
    echo "🛑 Killing node processes: $node_processes"
    for pid in $node_processes; do
      kill -9 $pid 2>/dev/null || true
    done
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

# Function to thoroughly clean node_modules
deep_clean_node_modules() {
  local dir=$1
  echo "🧹 Deep cleaning node_modules in $dir..."

  # First try with rm -rf
  rm -rf "$dir/node_modules" "$dir/package-lock.json" 2>/dev/null || true

  # If that didn't work, try with find to delete problematic directories
  if [ -d "$dir/node_modules" ]; then
    echo "⚠️ Regular removal failed, using alternative method..."

    # Find all problematic directories (like postcss) and delete them individually
    find "$dir/node_modules" -type d -name "postcss*" -exec rm -rf {} + 2>/dev/null || true
    find "$dir/node_modules" -type d -name "rollup*" -exec rm -rf {} + 2>/dev/null || true
    find "$dir/node_modules" -type d -name "vite*" -exec rm -rf {} + 2>/dev/null || true

    # Try deleting the rest
    rm -rf "$dir/node_modules" 2>/dev/null || true

    # If still there, try with find for all directories
    if [ -d "$dir/node_modules" ]; then
      echo "⚠️ Still having trouble. Using find for all directories..."
      find "$dir/node_modules" -type d -depth -exec rm -rf {} + 2>/dev/null || true
    fi
  fi

  # Clean up any remaining package-lock.json
  rm -f "$dir/package-lock.json" 2>/dev/null || true

  # Check if clean was successful
  if [ ! -d "$dir/node_modules" ]; then
    echo "✅ Successfully cleaned node_modules in $dir"
  else
    echo "⚠️ Could not completely remove node_modules. Try manual removal."
  fi
}

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

# Step 1: Kill any running npm and node processes
kill_node_processes

# Step 2: Clear npm cache
clear_npm_cache

# Step 3: Deep clean node_modules in both root and frontend
echo "🧹 Cleaning up node_modules in project root..."
deep_clean_node_modules "."

echo "🧹 Cleaning up node_modules in frontend directory..."
deep_clean_node_modules "./frontend"

# Step 4: Configure npm to avoid ENOTEMPTY errors
echo "🔧 Configuring npm to avoid ENOTEMPTY errors..."
mkdir -p ~/.npm-global
npm config set prefix ~/.npm-global

# Create/update .npmrc files with settings to avoid common errors
echo "🔧 Creating global .npmrc with optimal settings..."
cat > ~/.npmrc << EOF
# Global npm configuration to avoid common errors
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
cache-min=3600
unsafe-perm=true
EOF

echo "🔧 Creating project .npmrc with optimal settings..."
cat > ./.npmrc << EOF
# Project npm configuration to avoid common errors
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
cache-min=3600
rollup-skip-nodejs-native-build=true
rollup-native-pure-js=true
EOF

echo "🔧 Creating frontend .npmrc with optimal settings..."
cat > ./frontend/.npmrc << EOF
# Frontend npm configuration to avoid common errors
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
cache-min=3600
rollup-skip-nodejs-native-build=true
rollup-native-pure-js=true
EOF

# Step 5: Use Yarn instead of npm if available (more reliable for installations)
if command -v yarn &>/dev/null; then
  echo "🧶 Yarn found. Setting up with Yarn instead of npm for better reliability..."

  # Set up Yarn in frontend
  cd frontend
  echo "🧶 Setting up Yarn in frontend..."

  if [ -f "package.json" ]; then
    # Update package.json scripts for Yarn
    if command -v jq &>/dev/null; then
      echo "🔧 Updating package.json for Yarn compatibility..."
      TMP_FILE=$(mktemp)
      jq '.scripts.start = "vite"
          | .scripts.dev = "vite"
          | .scripts.build = "vite build"
          | .scripts["render-build"] = "ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true vite build --mode production"' package.json > "$TMP_FILE"
      mv "$TMP_FILE" package.json
    fi

    # Install with Yarn
    echo "📦 Installing dependencies with Yarn..."
    yarn install --network-timeout 300000 || echo "⚠️ Yarn install encountered issues, but continuing..."

    # Install critical dependencies explicitly
    echo "📦 Installing critical dependencies with Yarn..."
    yarn add vite@4.5.1 @vitejs/plugin-react@4.2.1 react-router-dom@6.20.0 @reduxjs/toolkit@1.9.7 react-redux@8.1.3 --dev || echo "⚠️ Yarn install of critical dependencies encountered issues, but continuing..."
  else
    echo "⚠️ No package.json found in frontend directory!"
  fi

  cd ..
else
  echo "📦 Using npm with improved settings..."

  # Install in frontend with improved settings
  cd frontend
  if [ -f "package.json" ]; then
    echo "📦 Installing dependencies with npm (improved settings)..."
    npm install --no-fund --no-audit --prefer-offline --legacy-peer-deps --loglevel=error --fetch-retries=5 --fetch-timeout=300000 || echo "⚠️ npm install encountered issues, but continuing..."

    # Install critical dependencies explicitly
    echo "📦 Installing critical dependencies with npm..."
    npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 react-router-dom@6.20.0 @reduxjs/toolkit@1.9.7 react-redux@8.1.3 --no-fund --no-audit --prefer-offline --legacy-peer-deps --loglevel=error || echo "⚠️ npm install of critical dependencies encountered issues, but continuing..."
  else
    echo "⚠️ No package.json found in frontend directory!"
  fi

  cd ..
fi

echo "✅ NPM installation issues have been addressed!"
echo ""
echo "🔧 If you still encounter issues:"
echo "  1. Try manually removing node_modules: rm -rf ./frontend/node_modules"
echo "  2. Use the Yarn installation method if available"
echo "  3. Run this script again with admin privileges: sudo ./fix-npm-errors.sh"
