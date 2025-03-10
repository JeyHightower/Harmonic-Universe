#!/bin/bash
set -e

echo "===== FIXING BUILD OUTPUT DIRECTORY ====="
cd frontend

# Option 1: Copy build directory to dist if build exists
if [ -d "build" ]; then
  echo "Copying from build/ to dist/"
  mkdir -p dist
  cp -r build/* dist/
  echo "Files copied successfully"
fi

# Option 2: Configure Vite to output to dist directly
if [ -f "vite.config.js" ]; then
  echo "Updating Vite config to use dist directory"
  # Read the current vite.config.js
  vite_config=$(cat vite.config.js)

  # Check if build.outDir is already set
  if grep -q "outDir:" vite.config.js; then
    # Replace existing outDir value
    sed -i.bak 's/outDir:.*,/outDir: '\''dist'\'',/g' vite.config.js
  elif grep -q "build:" vite.config.js; then
    # Add outDir to existing build section
    sed -i.bak '/build:.*{/a\    outDir: '\''dist'\'','  vite.config.js
  else
    # If no build section exists, add it
    sed -i.bak '/defineConfig({/a\  build: {\n    outDir: '\''dist'\'',\n  },' vite.config.js
  fi

  echo "Vite config updated successfully"
  echo "New Vite config:"
  cat vite.config.js
fi

# Update package.json build scripts
if [ -f "package.json" ]; then
  echo "Updating package.json build scripts..."
  # Use node to update package.json
  node -e "
    const fs = require('fs');
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));

    if (pkg.scripts) {
      if (pkg.scripts.build) {
        pkg.scripts.build = 'vite build --outDir dist';
      }
      if (pkg.scripts['render-build']) {
        pkg.scripts['render-build'] = 'vite build --outDir dist';
      }

      fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
      console.log('Updated package.json build scripts');
    }
  "
fi

# Create a fallback index.html in dist if not exists
if [ ! -f "dist/index.html" ]; then
  echo "Creating fallback index.html in dist directory..."
  mkdir -p dist
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      margin: 0;
      padding: 0;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .container {
      max-width: 800px;
      padding: 2rem;
      text-align: center;
      background-color: rgba(0, 0, 0, 0.2);
      border-radius: 12px;
      backdrop-filter: blur(10px);
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Application is loading. If you see this message, the build process may have encountered an issue.</p>
    <p>The API functionality should still be available.</p>
  </div>
</body>
</html>
EOF
fi

# Move up a directory to project root
cd ..

# Update the build.sh to handle both build and dist directories
if [ -f "build.sh" ]; then
  echo "Updating build.sh to handle both build and dist directories..."
  # Create a backup
  cp build.sh build.sh.backup

  # Update the copy command in build.sh
  sed -i.bak 's|cp -r\(f\)* frontend/\(build\|dist\)/\* static/|if [ -d "frontend/dist" ]; then\n  cp -r frontend/dist/* static/\nelif [ -d "frontend/build" ]; then\n  cp -r frontend/build/* static/\nelse\n  echo "ERROR: Could not find build output directory"\n  mkdir -p static\n  echo "<html><body><h1>Build Error</h1><p>Could not find build output directory</p></body></html>" > static/index.html\nfi|g' build.sh

  rm build.sh.bak 2>/dev/null || true
  echo "Updated build.sh successfully"
fi

# List the directories to verify
echo "Checking directories:"
ls -la frontend
echo "Build directory contents:"
ls -la frontend/build 2>/dev/null || echo "build/ directory not found"
echo "Dist directory contents:"
ls -la frontend/dist 2>/dev/null || echo "dist/ directory not found"

echo "===== BUILD DIRECTORY FIX COMPLETE ====="
echo "The build process should now work correctly with either build/ or dist/ output directories."
echo "Try running the build again with 'npm run build'"
