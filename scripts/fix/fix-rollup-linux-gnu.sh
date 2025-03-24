#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║         ROLLUP LINUX GNU ERROR RESOLUTION SCRIPT         ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

echo "🔧 Creating Rollup configuration file for Linux GNU systems..."

# Create a .npmrc file in the frontend directory with settings to fix Rollup native modules
echo "📝 Creating frontend/.npmrc with Rollup native module fixes..."
mkdir -p frontend
cat > frontend/.npmrc << EOF
# Fix for Rollup native modules on Linux GNU systems
rollup-skip-nodejs-native-build=true
rollup-native-pure-js=true
node-options=--max-old-space-size=4096 --experimental-vm-modules
legacy-peer-deps=true
fund=false
audit=false
EOF

# Create a project-level .npmrc
echo "📝 Creating project-level .npmrc with Rollup native module fixes..."
cat > .npmrc << EOF
# Fix for Rollup native modules on Linux GNU systems
rollup-skip-nodejs-native-build=true
rollup-native-pure-js=true
node-options=--max-old-space-size=4096 --experimental-vm-modules
legacy-peer-deps=true
fund=false
audit=false
EOF

# Create environment variables file for Rollup
echo "📝 Creating .env file for Rollup configuration..."
cat > frontend/.env << EOF
# Environment variables for Rollup
ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
ROLLUP_NATIVE_PURE_JS=true
ROLLUP_DISABLE_NATIVE=true
VITE_SKIP_ROLLUP_NATIVE=true
VITE_PURE_JS=true
VITE_FORCE_ESM=true
EOF

echo "✅ Rollup Linux GNU error fixes have been applied!"
echo ""
echo "🔧 If you encounter further Rollup issues:"
echo "  1. Try building with an explicit ESM flag: VITE_FORCE_ESM=true npm run build"
echo "  2. For Render.com deployments, make sure the build command includes the necessary environment variables"
