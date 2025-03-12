#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           FIXING NPM ENOTEMPTY ERRORS                    ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Check if running on macOS
if [[ "$(uname)" == "Darwin" ]]; then
  echo "🍎 Detected macOS system. Applying macOS-specific fixes..."

  # macOS specific fixes
  echo "🔍 Checking for any stuck npm or node processes..."
  ps aux | grep -E 'npm|node' | grep -v grep

  echo "🔄 Terminating any npm or node processes that might be locking files..."
  pkill -f npm || echo "💡 No npm processes found to terminate."
  pkill -f node || echo "💡 No node processes found to terminate."
  echo "⏱️ Waiting a moment for processes to terminate..."
  sleep 2
fi

# Clear npm cache for problematic packages
echo "🧹 Clearing npm cache for problematic packages..."
npm cache clean --force

# Check if node_modules directory exists before trying to remove subdirectories
if [ -d "node_modules" ]; then
  # Remove the problematic esbuild directories
  echo "🧹 Removing problematic esbuild directories..."
  rm -rf node_modules/@esbuild
  rm -rf node_modules/.esbuild*
  rm -rf node_modules/.vite node_modules/.cache node_modules/.tmp

  # Clean deeper in node_modules
  echo "🧹 Deep cleaning node_modules..."
  find node_modules -type d -name ".vite" -exec rm -rf {} \; 2>/dev/null || true
  find node_modules -type d -name ".cache" -exec rm -rf {} \; 2>/dev/null || true
  find node_modules -type d -name ".tmp" -exec rm -rf {} \; 2>/dev/null || true
  find node_modules -type d -name "darwin-arm64" -exec rm -rf {} \; 2>/dev/null || true
else
  echo "💡 No node_modules directory found. Creating one..."
  mkdir -p node_modules
fi

# Create a custom .npmrc file with settings to prevent ENOTEMPTY
echo "📝 Creating custom .npmrc file..."
cat > .npmrc << EOF
fund=false
audit=false
loglevel=error
prefer-offline=false
legacy-peer-deps=true
unsafe-perm=true
no-package-lock=true
force=true
EOF

# Try to install dependencies with special flags
echo "📦 Installing dependencies with special flags..."
npm install --no-save --no-optional --no-fund --legacy-peer-deps --force --no-package-lock --unsafe-perm || {
  echo "⚠️ Initial install failed. Trying more aggressive approach..."

  # More aggressive cleanup
  rm -rf node_modules
  mkdir -p node_modules

  # Try again with more flags
  npm install --no-save --no-optional --no-fund --legacy-peer-deps --force --no-package-lock --unsafe-perm --cache-min=999999
}

# Install vite with special flags to avoid ENOTEMPTY errors
echo "📦 Installing vite with special flags..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional --no-fund --legacy-peer-deps --force --no-package-lock --unsafe-perm || {
  echo "⚠️ Vite install failed. Trying with npx..."

  # Try installing with npx instead
  npx --yes vite@4.5.1 --help > /dev/null
  echo "✅ Verified vite is available through npx"
}

echo "✅ ENOTEMPTY fixes applied successfully!"
echo "🚀 You can now run the deployment script: ./fix-deploy.sh"
