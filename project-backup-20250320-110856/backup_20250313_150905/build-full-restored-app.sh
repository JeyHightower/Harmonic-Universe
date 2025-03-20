#!/bin/bash

# Script to restore and build the COMPLETE Harmonic Universe application
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║        RESTORING AND BUILDING HARMONIC UNIVERSE           ║"
echo "╚═══════════════════════════════════════════════════════════╝"

# Set environment variables
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export ROLLUP_NATIVE_PURE_JS=true
export ROLLUP_DISABLE_NATIVE=true
export NODE_OPTIONS="--max-old-space-size=4096 --experimental-vm-modules"

# Install NVM if it's not already installed
if [ ! -d "$HOME/.nvm" ]; then
  echo "Installing NVM..."
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
fi

# Set up NVM
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"

# Install and use the correct Node.js version
echo "Installing and using Node.js 18.19.0..."
nvm install 18.19.0
nvm use 18.19.0

# Check Node.js and npm versions
echo "Node.js version:"
node -v
echo "npm version:"
npm -v

# First, restore the application structure
echo "🔄 Running application restoration script..."
./restore-app.sh

# Now build the app using the fixed files
cd frontend || exit 1
echo "📂 Changed to frontend directory: $(pwd)"

# Clean npm cache
echo "🧹 Cleaning npm cache..."
npm cache clean --force

# Install dependencies
echo "📦 Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps --no-fund --no-optional --force --no-package-lock

# Install Express explicitly
echo "📦 Installing Express explicitly..."
npm install express --save

# Fix Rollup native module issues
echo "🔧 Fixing Rollup native module issues..."
if [ -f "node_modules/rollup/dist/es/shared/node-entry.js" ]; then
  echo "Patching node_modules/rollup/dist/es/shared/node-entry.js..."
  sed -i.bak 's/import { createRequire } from '\''module'\''/import module from '\''module'\''\nconst { createRequire } = module/g' node_modules/rollup/dist/es/shared/node-entry.js
  echo "✅ Fixed node_modules/rollup/dist/es/shared/node-entry.js"
fi

# Create SPA routing file
echo "📝 Creating _redirects file for SPA routing..."
mkdir -p dist
cat > dist/_redirects << EOL
/*    /index.html   200
EOL

# Check for index.js content
echo "🔍 Checking if src/index.js contains app code..."
if [ -f "src/index.js" ]; then
  INDEX_SIZE=$(wc -c < src/index.js)
  echo "src/index.js size: $INDEX_SIZE bytes"

  if [ "$INDEX_SIZE" -gt 1000 ]; then
    echo "src/index.js is substantial ($INDEX_SIZE bytes), examining content..."

    # Check for Redux patterns
    if grep -q "createStore\|configureStore\|Provider\|useSelector\|useDispatch" src/index.js; then
      echo "Found Redux patterns in src/index.js"
    fi

    # Check for Router patterns
    if grep -q "Router\|Route\|Switch\|BrowserRouter" src/index.js; then
      echo "Found Router patterns in src/index.js"
    fi
  fi
fi

# Build the app
echo "🔨 Building the application..."
npm run build

# Check if build succeeded
if [ -f "dist/index.html" ]; then
  echo "✅ Build successful!"

  # Check the size of the build
  echo "📊 Build output size:"
  du -sh dist/
  echo "📊 Detailed file listing:"
  find dist -type f | sort

  # Detailed asset analysis
  echo "📊 Detailed asset size analysis:"
  find dist -type f -name "*.js" -o -name "*.css" | xargs du -sh
else
  echo "❌ Build failed. Check the logs above for errors."
  exit 1
fi

echo "🚀 Full application build and restoration completed!"
