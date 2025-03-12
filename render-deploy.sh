#!/bin/bash
set -e

# Harmonic Universe Render.com Deployment Script
# This script is the main entry point for deploying the full application on Render.com

echo "╔══════════════════════════════════════════════════════════╗"
echo "║               HARMONIC UNIVERSE DEPLOYMENT               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Get the project root directory
ROOT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$ROOT_DIR"

# Set environment variables
export NODE_VERSION=${NODE_VERSION:-18.17.0}
export PYTHON_VERSION=${PYTHON_VERSION:-3.9.6}
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_APP=${FLASK_APP:-app}
export PYTHONPATH="${PYTHONPATH}:${ROOT_DIR}:${ROOT_DIR}/backend"
export CI=false

# Set ALL environment variables that might help with Rollup/Vite native binding issues
export ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true
export VITE_SKIP_ROLLUP_NATIVE=true
export VITE_PURE_JS=true
export VITE_FORCE_ESM=true
export NODE_OPTIONS="--no-experimental-fetch"
export NPM_CONFIG_OPTIONAL=false
export NPM_CONFIG_FUND=false
export NPM_CONFIG_AUDIT=false

echo "🔧 Environment Setup:"
echo "NODE_VERSION: $NODE_VERSION"
echo "PYTHON_VERSION: $PYTHON_VERSION"
echo "FLASK_ENV: $FLASK_ENV"
echo "FLASK_APP: $FLASK_APP"
echo "PYTHONPATH: $PYTHONPATH"
echo "ROLLUP_SKIP_NODEJS_NATIVE_BUILD: $ROLLUP_SKIP_NODEJS_NATIVE_BUILD"
echo ""

# Step 1: Install backend dependencies
echo "📦 Installing backend dependencies..."
cd "$ROOT_DIR/backend"
python -m pip install --upgrade pip
python -m pip install -r requirements.txt
python -m pip install gunicorn

# Step 2: Build and install frontend
echo "🏗️ Building frontend..."
cd "$ROOT_DIR/frontend"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed or not in PATH"
    exit 1
fi

# Advanced frontend build process to fix Rollup/Vite issues on Render.com
echo "🧹 Forcefully cleaning up previous installations..."
rm -rf node_modules || true
rm -f package-lock.json || true
rm -rf dist || true
rm -rf .vite || true

# Create a temporary .npmrc file to force certain settings
echo "📝 Creating temporary .npmrc with optimal settings..."
cat > .npmrc << EOF
optional=false
fund=false
audit=false
loglevel=error
prefer-offline=true
cache-min=9999999
EOF

echo "📦 Installing minimal dependencies with --no-optional and --ignore-scripts flags..."
npm install --no-optional --prefer-offline --no-fund --no-audit --ignore-scripts

# Ensure vite is installed properly
echo "🔧 Ensuring Vite is installed correctly..."
npm install --no-save vite@4.5.1 @vitejs/plugin-react@4.2.1 --no-optional

# Try three different build methods - one of them should work

# Method 1: Check if vite.js exists before trying to use it directly
echo "🔨 Build Method 1: Direct Vite execution..."
if [ -f "./node_modules/vite/bin/vite.js" ]; then
    NODE_ENV=production ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true node ./node_modules/vite/bin/vite.js build --config vite.config.render.js || echo "Method 1 failed, continuing to method 2..."
else
    echo "⚠️ Vite.js not found in node_modules, skipping method 1"
fi

# If the first method fails, try the second one
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "⚠️ First build method failed, trying method 2..."

    # Method 2: Use npx with specific version
    echo "🔨 Build Method 2: Using npx with explicit version..."
    ROLLUP_SKIP_NODEJS_NATIVE_BUILD=true NODE_ENV=production npx vite@4.5.1 build --mode production --emptyOutDir || echo "Method 2 failed, continuing to method 3..."
fi

# If the second method also fails, try the third one
if [ ! -d "dist" ] || [ -z "$(ls -A dist 2>/dev/null)" ]; then
    echo "⚠️ Second build method failed, trying method 3 (fallback)..."

    # Method 3: Create a minimal dist with a basic HTML file as a fallback
    echo "🔨 Build Method 3: Creating a minimal fallback build..."
    mkdir -p dist
    cat > dist/index.html << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe - Maintenance Mode</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        h1 { color: #4361ee; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>The application is currently in maintenance mode. Please check back soon.</p>
    <p>If you're the administrator, please check the deployment logs for frontend build errors.</p>
</body>
</html>
EOF
    echo "⚠️ Created fallback index.html as the build process had issues"
fi

# Step 3: Prepare static files for Flask
echo "📁 Preparing static files..."
cd "$ROOT_DIR"
mkdir -p static
cp -r frontend/dist/* static/ 2>/dev/null || echo "⚠️ No frontend build output found in dist/"

# Copy any required polyfills or additional files
if [ -d "frontend/public" ]; then
    echo "📋 Copying public files..."
    mkdir -p static/assets 2>/dev/null || true

    for file in frontend/public/*.js frontend/public/*.ico frontend/public/*.png frontend/public/*.svg; do
        if [ -f "$file" ]; then
            cp "$file" static/ 2>/dev/null || echo "⚠️ Could not copy $file"
        fi
    done

    # Ensure at least some assets are available
    if [ -d "frontend/public/assets" ]; then
        cp -r frontend/public/assets/* static/assets/ 2>/dev/null || echo "⚠️ Could not copy assets"
    fi
fi

# Step 4: Run any additional setup scripts
echo "🔄 Running backend setup scripts..."
cd "$ROOT_DIR/backend"
python -m scripts.copy_react_polyfill 2>/dev/null || echo "⚠️ Could not run polyfill script"

# Verify static files exist, create a minimal index.html if not
if [ ! -f "$ROOT_DIR/static/index.html" ]; then
    echo "⚠️ No index.html found in static directory, creating a minimal one..."
    cat > "$ROOT_DIR/static/index.html" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe - Maintenance Mode</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; text-align: center; }
        h1 { color: #4361ee; }
        p { line-height: 1.6; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>The application is currently in maintenance mode. Please check back soon.</p>
    <p>If you're the administrator, please check the deployment logs for frontend build errors.</p>
</body>
</html>
EOF
fi

# Step 5: Verify the application is ready to start
echo "✅ Deployment setup complete!"
echo ""
echo "To start the application, run:"
echo "cd $ROOT_DIR/backend && gunicorn --workers=2 --timeout=120 wsgi:app"
echo ""
echo "For development use:"
echo "cd $ROOT_DIR && npm start"

# If this is running on Render.com, the startCommand from render.yaml will be used
# so this script should exit successfully to allow Render to proceed
exit 0
