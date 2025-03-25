#!/bin/bash
set -e

echo "===== UPDATING DEPLOY SCRIPT TO INCLUDE START.SH FIX ====="
echo "Date: $(date)"

# Backup deploy-with-fixes.sh
if [ -f "deploy-with-fixes.sh" ]; then
  cp deploy-with-fixes.sh deploy-with-fixes.sh.backup
  echo "Created backup of deploy-with-fixes.sh"
fi

# Create updated deploy-with-fixes.sh
cat > deploy-with-fixes.sh << 'EOF'
#!/bin/bash
set -e

echo "===== COMPREHENSIVE DEPLOYMENT FIX SCRIPT ====="
echo "Date: $(date)"
echo "This script will apply all fixes needed for successful deployment"
echo

# Step 1: Fix frontend build directory issues
echo "STEP 1: Fixing frontend build directory issues..."
if [ -f "./fix-build-directory.sh" ]; then
  ./fix-build-directory.sh
else
  echo "ERROR: fix-build-directory.sh not found!"
  exit 1
fi
echo

# Step 2: Fix WSGI configuration and clean up start.sh
echo "STEP 2: Fixing Flask start script..."
if [ -f "./fix-start-script.sh" ]; then
  ./fix-start-script.sh
else
  echo "WARNING: fix-start-script.sh not found!"
  echo "Skipping this step. Your start.sh may need manual fixing."
fi
echo

# Step 3: Create or update render.yaml if it doesn't exist
echo "STEP 3: Checking render.yaml configuration..."
if [ ! -f "render.yaml" ]; then
  echo "Creating render.yaml file..."
  cat > render.yaml << 'EOFRENDER'
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
EOFRENDER
  echo "Created render.yaml file"
else
  echo "render.yaml already exists, ensuring it has proper configurations..."

  # Ensure NODE_OPTIONS is set
  if ! grep -q "NODE_OPTIONS" render.yaml; then
    sed -i.bak '/envVars:/a\      - key: NODE_OPTIONS\n        value: --max-old-space-size=4096' render.yaml
    echo "Added NODE_OPTIONS to render.yaml"
  fi

  # Ensure VITE_APP_DEBUG is set
  if ! grep -q "VITE_APP_DEBUG" render.yaml; then
    sed -i.bak '/envVars:/a\      - key: VITE_APP_DEBUG\n        value: "true"' render.yaml
    echo "Added VITE_APP_DEBUG to render.yaml"
  fi

  # Clean up backup files
  rm render.yaml.bak 2>/dev/null || true
fi
echo

# Step 4: Final verification
echo "STEP 4: Final verification..."

# Check if start.sh exists and is executable
if [ -f "start.sh" ]; then
  chmod +x start.sh
  echo "✓ start.sh exists and is executable"
else
  echo "✗ start.sh is missing!"
fi

# Check if build.sh exists and is executable
if [ -f "build.sh" ]; then
  chmod +x build.sh
  echo "✓ build.sh exists and is executable"
else
  echo "✗ build.sh is missing!"
fi

# Check for frontend directory
if [ -d "frontend" ]; then
  echo "✓ frontend directory exists"
else
  echo "✗ frontend directory is missing!"
fi

# Check for Flask app structure
if [ -f "app.py" ] || ([ -d "app" ] && [ -f "app/__init__.py" ]); then
  echo "✓ Flask application structure looks good"
else
  echo "✗ Flask application structure is unusual - deployment might fail"
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
echo "5. Monitor the build logs for any remaining issues"
EOF

# Make deploy-with-fixes.sh executable
chmod +x deploy-with-fixes.sh

echo "===== DEPLOY SCRIPT UPDATED SUCCESSFULLY ====="
echo "The deploy-with-fixes.sh script now includes the fixed start.sh implementation"
echo
echo "To run all fixes at once, execute: ./deploy-with-fixes.sh"
