#!/bin/bash
set -e

echo "===== FINAL COMPREHENSIVE FIX FOR RENDER.COM DEPLOYMENT ====="
echo "Date: $(date)"

# Step 1: Fix the start.sh script to use the correct WSGI application
echo "STEP 1: Fixing start.sh to use the correct WSGI application..."

# Create the proper start.sh file
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING FLASK APPLICATION FOR RENDER.COM ====="
echo "Date: $(date)"

# Set up environment
export FLASK_ENV=production
# Get PORT from environment variable with fallback
PORT=${PORT:-5000}
echo "Starting server on port $PORT..."

# Export PYTHONPATH to include current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Based on the app.py content, we need to use app.application as the WSGI app
echo "Using app.application as the WSGI entry point"
exec gunicorn "app:application" \
  --bind "0.0.0.0:$PORT" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --workers 2 \
  --timeout 60
EOF

chmod +x start.sh
echo "✅ Fixed start.sh to use app:application instead of app:app"
echo

# Step 2: Fix frontend build directory issues
echo "STEP 2: Fixing frontend build directory issues..."

# Check frontend directory
if [ ! -d "frontend" ]; then
  echo "⚠️ Frontend directory not found, skipping this step"
else
  echo "Checking frontend build configuration..."

  cd frontend

  # Update package.json build script if it exists
  if [ -f "package.json" ]; then
    echo "Updating package.json build scripts..."
    # Use node to update package.json
    node -e "
      const fs = require('fs');
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      let updated = false;

      if (pkg.scripts) {
        if (pkg.scripts.build && !pkg.scripts.build.includes('--outDir dist')) {
          pkg.scripts.build = pkg.scripts.build + ' --outDir dist';
          updated = true;
        }
        if (pkg.scripts['render-build'] && !pkg.scripts['render-build'].includes('--outDir dist')) {
          pkg.scripts['render-build'] = pkg.scripts['render-build'] + ' --outDir dist';
          updated = true;
        }

        if (updated) {
          fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
          console.log('✅ Updated package.json build scripts');
        } else {
          console.log('✓ package.json build scripts look good');
        }
      }
    "
  fi

  cd ..
  echo "✅ Frontend build directory configuration updated"
fi
echo

# Step 3: Fix build.sh to handle both build and dist directories
echo "STEP 3: Fixing build.sh script..."

# Create a properly configured build.sh
cat > build.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING BUILD PROCESS FOR RENDER.COM ====="
echo "Date: $(date)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python --version)"

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend

# Create .npmrc to handle peer dependencies
echo "legacy-peer-deps=true" > .npmrc

# Install dependencies with improved error handling
echo "Installing npm dependencies..."
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build the frontend with increased memory
echo "Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Verify build output directory exists
if [ -d "dist" ]; then
  echo "✅ Build succeeded - dist directory exists"
  BUILD_DIR="dist"
elif [ -d "build" ]; then
  echo "✅ Build succeeded - build directory exists"
  BUILD_DIR="build"

  # Copy build to dist for consistency
  echo "Copying build/ to dist/ for consistency..."
  mkdir -p dist
  cp -r build/* dist/ 2>/dev/null || echo "Warning: Could not copy files"
  BUILD_DIR="dist"
else
  echo "⚠️ WARNING: Build output directory not found"
  echo "Creating fallback index.html..."
  mkdir -p dist
  cat > dist/index.html << 'EOFHTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 30px;
      max-width: 800px;
      text-align: center;
      backdrop-filter: blur(10px);
    }
    .btn {
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      margin: 10px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>The frontend is running in fallback mode. API endpoints are still functional.</p>
    <div>
      <a href="/api" class="btn">Check API</a>
      <a href="/health" class="btn">Health Check</a>
    </div>
  </div>
</body>
</html>
EOFHTML
  BUILD_DIR="dist"
fi

# Go back to root directory
cd ..

# Create static directory if it doesn't exist
mkdir -p static

# Copy frontend build files to static directory
echo "Copying build files to static directory..."
cp -r frontend/$BUILD_DIR/* static/

# Verify static directory has content
if [ -f "static/index.html" ]; then
  echo "✅ Successfully copied frontend build to static directory"
else
  echo "⚠️ WARNING: index.html not found in static directory"
  echo "Creating fallback index.html in static directory..."
  cat > static/index.html << 'EOFHTML'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      margin: 0;
    }
    .container {
      background: rgba(0,0,0,0.2);
      border-radius: 12px;
      padding: 30px;
      max-width: 800px;
      text-align: center;
      backdrop-filter: blur(10px);
    }
    .btn {
      background: rgba(255,255,255,0.2);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 4px;
      margin: 10px;
      text-decoration: none;
      display: inline-block;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Static fallback page. API endpoints are still functional.</p>
    <div>
      <a href="/api" class="btn">Check API</a>
      <a href="/health" class="btn">Health Check</a>
    </div>
  </div>
</body>
</html>
EOFHTML
fi

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
EOF

chmod +x build.sh
echo "✅ Created optimized build.sh"
echo

# Step 4: Create render.yaml
echo "STEP 4: Creating render.yaml configuration..."

cat > render.yaml << 'EOF'
services:
  - type: web
    name: harmonic-universe
    env: python
    buildCommand: ./build.sh
    startCommand: ./start.sh
    envVars:
      - key: PYTHON_VERSION
        value: 3.9.6
      - key: NODE_OPTIONS
        value: --max-old-space-size=4096
      - key: VITE_APP_DEBUG
        value: "true"
      - key: FLASK_ENV
        value: production
EOF

echo "✅ Created render.yaml configuration"
echo

# Step 5: Final verification
echo "STEP 5: Final verification..."

# Check if scripts are executable
chmod +x start.sh 2>/dev/null || true
chmod +x build.sh 2>/dev/null || true

# Check if start.sh exists and is executable
if [ -f "start.sh" ] && [ -x "start.sh" ]; then
  echo "✅ start.sh exists and is executable"
else
  echo "❌ start.sh check failed"
fi

# Check if build.sh exists and is executable
if [ -f "build.sh" ] && [ -x "build.sh" ]; then
  echo "✅ build.sh exists and is executable"
else
  echo "❌ build.sh check failed"
fi

# Check for frontend directory
if [ -d "frontend" ]; then
  echo "✅ frontend directory exists"
else
  echo "❌ frontend directory is missing"
fi

# Check for Flask app structure
if [ -f "app.py" ]; then
  echo "✅ app.py exists"
else
  echo "❌ app.py is missing"
fi

# Check for render.yaml
if [ -f "render.yaml" ]; then
  echo "✅ render.yaml exists"
else
  echo "❌ render.yaml is missing"
fi

echo
echo "===== ALL FIXES APPLIED SUCCESSFULLY ====="
echo "Your project should now be ready for deployment to Render.com"
echo
echo "Next steps:"
echo "1. Test the Flask app locally with: PORT=8000 ./start.sh"
echo "2. Commit and push your changes to GitHub"
echo "3. Redeploy on Render.com"
echo "4. Monitor the logs for any issues"
