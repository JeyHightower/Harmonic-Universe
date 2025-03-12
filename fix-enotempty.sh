#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             ENOTEMPTY ERROR FIX                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

# First kill any npm processes that might be locking files
echo "🛑 Terminating any npm processes..."
pkill -f npm || true
pkill -f node || true
sleep 2

# Clean up node_modules directory in the frontend
echo "🧹 Cleaning up frontend/node_modules directory..."
rm -rf frontend/node_modules frontend/package-lock.json 2>/dev/null || true

# Clean up node_modules directory in the project root
echo "🧹 Cleaning up node_modules in project root..."
rm -rf node_modules package-lock.json 2>/dev/null || true

# Create an .npmrc file with settings to avoid ENOTEMPTY errors
echo "🔧 Creating .npmrc files with settings to avoid ENOTEMPTY errors..."

# Create project root .npmrc
cat > .npmrc << EOF
# Fix for ENOTEMPTY errors
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
cache-min=3600
EOF

# Create frontend .npmrc
cat > frontend/.npmrc << EOF
# Fix for ENOTEMPTY errors
legacy-peer-deps=true
fund=false
audit=false
loglevel=error
fetch-retries=5
fetch-retry-mintimeout=20000
fetch-retry-maxtimeout=120000
fetch-timeout=300000
cache-min=3600
EOF

# Clear npm cache
echo "🧹 Clearing npm cache..."
npm cache clean --force

echo "✅ ENOTEMPTY error fixes applied."
echo ""
echo "🚀 Next steps:"
echo "  1. To reinstall dependencies, run:"
echo "     cd frontend && npm install --legacy-peer-deps"
echo ""
echo "  2. If you still encounter ENOTEMPTY errors, try:"
echo "     npm install --prefer-offline --no-fund --legacy-peer-deps"
