#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║           FIXING NPM ENOTEMPTY ERRORS                    ║"
echo "╚══════════════════════════════════════════════════════════╝"

# Terminate any npm processes that might be locking files
echo "🔄 Terminating any npm processes that might be locking files..."
pkill -f npm || true
pkill -f node || true
sleep 1

# Clear npm cache for problematic packages
echo "🧹 Clearing npm cache for problematic packages..."
npm cache clean --force

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

# Install vite with special flags to avoid ENOTEMPTY errors
echo "📦 Installing vite with special flags..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional --no-fund --legacy-peer-deps --force --no-package-lock --unsafe-perm

echo "✅ ENOTEMPTY fixes applied successfully!"
echo "🚀 You can now run the deployment script: ./fix-deploy.sh"
