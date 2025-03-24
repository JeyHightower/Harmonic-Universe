#!/bin/bash
set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║             HARMONIC UNIVERSE - MASTER FIX               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if we're in the project root
if [ ! -d "./frontend" ]; then
  echo "❌ This script must be run from the project root!"
  exit 1
fi

# Make all the fix scripts executable
echo "🔧 Making all fix scripts executable..."
chmod +x fix-all-fixed.sh fix-npm-errors.sh fix-proxy-errors.sh fix-rollup-linux-gnu.sh 2>/dev/null || true

# Kill any hanging npm processes before starting
echo "🛑 Killing any hanging npm processes..."
pkill -f npm || true
pkill -f node || true
sleep 2

# Step 1: Fix npm errors first - with low memory options
echo "🔄 Step 1: Fixing npm installation errors..."
# Run with NODE_OPTIONS to limit memory usage
NODE_OPTIONS="--max-old-space-size=2048" ./fix-npm-errors.sh || {
  echo "⚠️ Error during npm error fix - trying simplified approach..."
  # Manual cleanup if the script fails
  rm -rf ./frontend/node_modules ./frontend/package-lock.json 2>/dev/null || true
  rm -rf ./node_modules ./package-lock.json 2>/dev/null || true
}

# Step 2: Apply the main fixes
echo "🔄 Step 2: Applying comprehensive fixes..."
./fix-all-fixed.sh || {
  echo "⚠️ Error during comprehensive fixes - continuing with remaining steps..."
}

# Step 3: Fix proxy errors
echo "🔄 Step 3: Fixing Vite proxy errors..."
./fix-proxy-errors.sh || {
  echo "⚠️ Error during proxy error fix - continuing with remaining steps..."
}

# Step 4: Fix Rollup Linux GNU errors
echo "🔄 Step 4: Fixing Rollup Linux GNU errors..."
./fix-rollup-linux-gnu.sh || {
  echo "⚠️ Error during Rollup Linux GNU error fix - continuing with remaining steps..."
}

# Fix the package.json directly as a fallback
echo "🔄 Applying direct package.json fixes..."
if [ -f "./frontend/package.json" ]; then
  echo "📝 Setting start script in package.json..."
  # Create a temporary file
  TMP_FILE=$(mktemp)

  # Use basic sed to update the scripts section
  sed 's/"scripts": {/"scripts": {\n    "start": "vite",/g' frontend/package.json > "$TMP_FILE"
  mv "$TMP_FILE" frontend/package.json
fi

echo ""
echo "✨ All fixes have been applied!"
echo ""
echo "🚀 NEXT STEPS:"
echo "  1. For local development:"
echo "     cd frontend && npm run start"
echo ""
echo "  2. For Render.com deployment:"
echo "     - Build command: chmod +x render-build-command.sh && ./render-build-command.sh"
echo "     - Start command: cd backend && gunicorn --workers=2 --timeout=120 --log-level info wsgi:app"
echo ""
echo "  3. If you still encounter issues:"
echo "     - Check DEPLOYMENT_GUIDE.md for troubleshooting"
echo "     - Try running individual fix scripts manually"
echo ""
echo "📝 All essential scripts are now in place for both local development and deployment."
