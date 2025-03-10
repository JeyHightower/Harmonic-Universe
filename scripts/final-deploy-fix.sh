#!/bin/bash
set -e

echo "===== FINAL DEPLOYMENT FIX SCRIPT ====="
echo "Date: $(date)"
echo "This script applies all fixes needed for a successful Render.com deployment"
echo "Compatible with macOS and Linux"
echo

# Step 1: Fix the start.sh script
echo "STEP 1: Fixing Flask start script..."
if [ -f "app.py" ]; then
  FLASK_APP_PATH="app:app"
  echo "Found app.py in root directory"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  FLASK_APP_PATH="app:app"
  echo "Found app package with __init__.py"
else
  # Search for the app.py or wsgi.py
  APP_FILE=$(find . -maxdepth 2 -name "app.py" -o -name "wsgi.py" | head -1)
  if [ -n "$APP_FILE" ]; then
    APP_FILE=$(basename "$APP_FILE" .py)
    FLASK_APP_PATH="$APP_FILE:app"
    echo "Found Flask application in $APP_FILE.py"
  else
    echo "ERROR: Could not find app.py or wsgi.py"
    FLASK_APP_PATH="app:app"  # Default fallback
    echo "Using default fallback: app:app"
  fi
fi

echo "Using WSGI application path: $FLASK_APP_PATH"

# Backup the old start.sh if it exists
if [ -f "start.sh" ]; then
  echo "Backing up existing start.sh to start.sh.backup"
  cp start.sh start.sh.backup
fi

# Create a clean start.sh file
echo "Creating a clean start.sh file..."
cat > start.sh << EOF
#!/bin/bash
# Flask application startup script for Harmonic Universe

# Diagnostic information
echo "===== FLASK APP DIAGNOSTICS ====="
if [ -f "app.py" ]; then
  echo "Found app.py in root directory"
  echo "First 10 lines of app.py:"
  head -n 10 app.py
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app package with __init__.py"
  echo "First 10 lines of app/__init__.py:"
  head -n 10 app/__init__.py
else
  echo "WARNING: Standard Flask app structure not found"
  echo "Searching for Python files:"
  find . -maxdepth 2 -name "*.py" | grep -v "__pycache__"
fi

# Get the PORT from environment or use default
PORT=\${PORT:-5000}
echo "Starting server on port \$PORT..."

# Start gunicorn server
gunicorn $FLASK_APP_PATH --bind 0.0.0.0:\$PORT --log-level info
EOF

# Make start.sh executable
chmod +x start.sh
echo "✓ Created and fixed start.sh"
echo

# Step 2: Fix frontend build directory issues
echo "STEP 2: Fixing frontend build directory issues..."

# Check frontend directory
if [ ! -d "frontend" ]; then
  echo "× Frontend directory not found!"
else
  cd frontend

  # Copy build to dist if it exists
  if [ -d "build" ] && [ ! -d "dist" ]; then
    echo "Copying from build/ to dist/"
    mkdir -p dist
    cp -r build/* dist/ 2>/dev/null || echo "Warning: Could not copy files"
    echo "✓ Files copied to dist/"
  fi

  # Update Vite configuration if it exists
  if [ -f "vite.config.js" ]; then
    echo "Updating Vite config to use dist directory"

    # Check if outDir is already set to 'dist'
    if grep -q "outDir:.*'dist'" vite.config.js || grep -q 'outDir:.*"dist"' vite.config.js; then
      echo "✓ Vite already configured to use dist/ directory"
    else
      # Create a backup
      cp vite.config.js vite.config.js.backup

      # Handle different possible formats
      if grep -q "outDir:" vite.config.js; then
        # Replace existing outDir
        perl -i -pe "s/outDir:.*,/outDir: 'dist',/g" vite.config.js
      elif grep -q "build:" vite.config.js; then
        # Add outDir to existing build section using awk
        awk '/build:/{found=1} found==1 && /\{/{print; print "    outDir: '\''dist'\'',"; found=0; next} 1' vite.config.js > vite.config.js.new
        mv vite.config.js.new vite.config.js
      else
        # Add new build section using awk
        awk '/defineConfig\({/{print; print "  build: {\n    outDir: '\''dist'\'',\n  },"; next} 1' vite.config.js > vite.config.js.new
        mv vite.config.js.new vite.config.js
      fi
      echo "✓ Updated Vite config to use dist/ directory"
    fi
  fi

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
          pkg.scripts.build = 'vite build --outDir dist';
          updated = true;
        }
        if (pkg.scripts['render-build'] && !pkg.scripts['render-build'].includes('--outDir dist')) {
          pkg.scripts['render-build'] = 'vite build --outDir dist';
          updated = true;
        }

        if (updated) {
          fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
          console.log('✓ Updated package.json build scripts');
        } else {
          console.log('✓ package.json build scripts already configured correctly');
        }
      }
    "
  fi

  cd ..
  echo "✓ Frontend build directory issues fixed"
fi
echo

# Step 3: Fix render.yaml configuration
echo "STEP 3: Fixing render.yaml configuration..."
if [ ! -f "render.yaml" ]; then
  echo "Creating render.yaml file..."
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
EOF
  echo "✓ Created render.yaml file"
else
  echo "render.yaml already exists, ensuring it has proper configurations..."

  # macOS-compatible approach using temporary files
  if ! grep -q "NODE_OPTIONS" render.yaml; then
    echo "Adding NODE_OPTIONS to render.yaml..."

    # Create a temporary file with the new content
    node_options_entry="      - key: NODE_OPTIONS
        value: --max-old-space-size=4096"

    # Use awk to insert at the right position (after envVars:)
    awk '/envVars:/{print; print "'"$node_options_entry"'"; next}1' render.yaml > render.yaml.new
    mv render.yaml.new render.yaml
    echo "✓ Added NODE_OPTIONS to render.yaml"
  fi

  if ! grep -q "VITE_APP_DEBUG" render.yaml; then
    echo "Adding VITE_APP_DEBUG to render.yaml..."

    # Create a temporary file with the new content
    vite_debug_entry="      - key: VITE_APP_DEBUG
        value: \"true\""

    # Use awk to insert at the right position (after envVars:)
    awk '/envVars:/{print; print "'"$vite_debug_entry"'"; next}1' render.yaml > render.yaml.new
    mv render.yaml.new render.yaml
    echo "✓ Added VITE_APP_DEBUG to render.yaml"
  fi

  echo "✓ render.yaml correctly configured"
fi
echo

# Step 4: Fix build.sh script to handle both build and dist
echo "STEP 4: Updating build.sh to handle both build and dist directories..."
if [ -f "build.sh" ]; then
  # Create backup
  cp build.sh build.sh.backup

  # Check if already updated
  if grep -q "if \[ -d \"frontend/dist\" \]" build.sh; then
    echo "✓ build.sh already updated to handle both directories"
  else
    # Find the line that copies frontend build files
    if grep -q "cp -r\(f\)* frontend/\(build\|dist\)/\* static/" build.sh || grep -q "cp -r frontend/build/\* static/" build.sh; then
      # Replace the copy command with a conditional version that checks both directories
      perl -i -pe 's|(cp -r\S* frontend/(?:build|dist)/\* static/.*)|if [ -d "frontend/dist" ]; then\n  cp -r frontend/dist/* static/\nelif [ -d "frontend/build" ]; then\n  cp -r frontend/build/* static/\nelse\n  echo "WARNING: Could not find build output directory"\n  mkdir -p static\n  echo "<html><body><h1>Build Error</h1><p>Could not find build output directory</p></body></html>" > static/index.html\nfi|g' build.sh

      echo "✓ Updated build.sh to handle both build/ and dist/ directories"
    else
      echo "⚠️ Could not find copy command in build.sh"
      echo "Manual review needed for build.sh"
    fi
  fi
else
  echo "Creating basic build.sh..."
  cat > build.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend

# Create .npmrc to handle peer dependencies
echo "legacy-peer-deps=true" > .npmrc

# Install dependencies with legacy peer deps
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Build the frontend
echo "Building frontend..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Go back to root directory
cd ..

# Create static directory if it doesn't exist
mkdir -p static

# Copy frontend build files to static directory
echo "Copying build files to static directory..."
if [ -d "frontend/dist" ]; then
  cp -r frontend/dist/* static/
elif [ -d "frontend/build" ]; then
  cp -r frontend/build/* static/
else
  echo "WARNING: Could not find build output directory"
  echo "<html><body><h1>Build Error</h1><p>Could not find build output directory</p></body></html>" > static/index.html
fi

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
EOF
  chmod +x build.sh
  echo "✓ Created build.sh script"
fi
echo

# Step 5: Final verification
echo "STEP 5: Final verification..."

# Check if scripts are executable
chmod +x start.sh 2>/dev/null || true
chmod +x build.sh 2>/dev/null || true

# Check if start.sh exists and is executable
if [ -f "start.sh" ] && [ -x "start.sh" ]; then
  echo "✓ start.sh exists and is executable"
else
  echo "× start.sh check failed"
fi

# Check if build.sh exists and is executable
if [ -f "build.sh" ] && [ -x "build.sh" ]; then
  echo "✓ build.sh exists and is executable"
else
  echo "× build.sh check failed"
fi

# Check for frontend directory
if [ -d "frontend" ]; then
  echo "✓ frontend directory exists"
else
  echo "× frontend directory is missing"
fi

# Check for Flask app structure
if [ -f "app.py" ] || ([ -d "app" ] && [ -f "app/__init__.py" ]); then
  echo "✓ Flask application structure looks good"
else
  echo "⚠️ Flask application structure is unusual - deployment might fail"
fi

# Check for render.yaml
if [ -f "render.yaml" ]; then
  echo "✓ render.yaml exists"
else
  echo "× render.yaml is missing"
fi

echo
echo "===== ALL FIXES APPLIED ====="
echo "Your project should now be ready for deployment to Render.com"
echo
echo "Next steps:"
echo "1. Test the build locally with: ./build.sh"
echo "2. Test the Flask app locally with: ./start.sh"
echo "3. Commit and push your changes to GitHub"
echo "4. Redeploy on Render.com"
