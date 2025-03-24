#!/bin/bash
set -e

echo "===== VERIFYING DEPLOYMENT CONFIGURATION ====="

# Check if critical files exist and are executable
FILES_TO_CHECK=(
  "start.sh"
  "build.sh"
  "render.yaml"
)

for file in "${FILES_TO_CHECK[@]}"; do
  if [ -f "$file" ]; then
    if [ -x "$file" ] || [[ "$file" != *.sh ]]; then
      echo "✅ $file exists and is properly set up"
    else
      echo "❌ $file exists but is not executable"
      chmod +x "$file"
      echo "   Fixed: made $file executable"
    fi
  else
    echo "❌ $file is missing"
  fi
done

# Check if frontend directory exists
if [ -d "frontend" ]; then
  echo "✅ frontend directory exists"
else
  echo "❌ frontend directory is missing"
fi

# Check for Flask app structure
if [ -f "app.py" ] || ([ -d "app" ] && [ -f "app/__init__.py" ]); then
  echo "✅ Flask application structure looks good"
else
  echo "⚠️ Non-standard Flask application structure"
fi

echo
echo "===== DEPLOYMENT CONFIGURATION VERIFICATION COMPLETE ====="
echo "Your project should now be ready for deployment to Render.com"
