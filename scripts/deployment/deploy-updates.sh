#!/bin/bash
# Deploy script for Harmonic Universe
# This script helps build and deploy the application to Render.com

# Set error handling
set -e

echo "===== Harmonic Universe Deployment Script ====="
echo "Starting deployment process..."

# Step 1: Rebuild the frontend
echo ""
echo "🔨 Step 1: Rebuilding the frontend..."
cd frontend
npm run build
echo "✅ Frontend build completed"

# Step 2: Copy files to static directory
echo ""
echo "📦 Step 2: Copying files to static directory..."
mkdir -p ../static
cp -r dist/* ../static/
echo "✅ Files copied to static directory"

# Step 3: Update version timestamp
echo ""
echo "🕒 Step 3: Updating version timestamp..."
current_date=$(date +%Y%m%d)
current_time=$(date +%H%M%S)
version_stamp="${current_date}${current_time}"
sed -i '' "s/buildDate: '[^']*'/buildDate: '$(date +%Y-%m-%d)'/" ../static/version.js
echo "✅ Version timestamp updated"

# Step 4: Clean up any unnecessary files
echo ""
echo "🧹 Step 4: Cleaning up..."
find ../static -name "*.map" -delete 2>/dev/null || true
echo "✅ Cleanup completed"

# Step 5: Verify deployment files
echo ""
echo "🔍 Step 5: Verifying deployment files..."
if [ -f "../static/index.html" ] && [ -f "../static/version.js" ]; then
  echo "✅ Required files verified"
else
  echo "❌ ERROR: Missing required files for deployment"
  exit 1
fi

echo ""
echo "====== Deployment preparation completed ======"
echo ""
echo "To deploy to Render.com:"
echo "1. Commit your changes with: git add . && git commit -m 'Update frontend with cache-busting fixes'"
echo "2. Push changes to your repository: git push"
echo "3. Render.com will automatically deploy the updated version"
echo ""
echo "Alternatively, trigger a manual deploy from the Render.com dashboard"
echo ""
echo "Deployment URL: https://harmonic-universe.onrender.com/"
echo "========================================"
