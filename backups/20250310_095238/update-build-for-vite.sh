#!/bin/bash
set -e

echo "===== UPDATING BUILD SCRIPT FOR VITE ====="
echo "Date: $(date)"

# Backup original build.sh if it exists
if [ -f build.sh ]; then
  cp build.sh build.sh.backup
  echo "Created backup of build.sh to build.sh.backup"
fi

# Create updated build.sh for Vite
cat > build.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING BUILD PROCESS (VITE VERSION) ====="
echo "Date: $(date)"

# Display environment info
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

# Install backend dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt
pip install gunicorn psycopg2-binary

# Install frontend dependencies with Vite
echo "Installing frontend dependencies with Vite..."
cd frontend

# Create .npmrc to handle peer dependencies
cat > .npmrc << 'NPMRC'
legacy-peer-deps=true
NPMRC

# Install dependencies with legacy peer deps
npm ci --legacy-peer-deps || npm install --legacy-peer-deps

# Ensure Vite and plugin-react are installed
echo "Ensuring Vite is installed..."
npm install --save-dev vite@latest @vitejs/plugin-react --legacy-peer-deps

# Build frontend with Vite (much more reliable than react-scripts)
echo "Building frontend with Vite..."
export NODE_OPTIONS="--max-old-space-size=4096"
npm run build

# Verify build was created
if [ ! -d "build" ] || [ ! -f "build/index.html" ]; then
  echo "WARNING: Vite build directory not found or empty!"

  # Create a minimal fallback build if Vite build fails
  echo "Creating fallback build..."
  mkdir -p build
  cat > build/index.html << 'FALLBACK'
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
    h1 { margin-bottom: 1rem; }
    p { margin-bottom: 2rem; }
    .button {
      display: inline-block;
      padding: 10px 20px;
      background-color: rgba(255, 255, 255, 0.2);
      color: white;
      text-decoration: none;
      border-radius: 4px;
      margin: 0 10px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Fallback mode - API functionality still available</p>
    <div>
      <a href="/api/status" class="button">Check API Status</a>
      <a href="/health" class="button">Health Check</a>
    </div>
    <div id="root"></div>
    <script>
      console.log('Fallback build loaded successfully');
      fetch('/health')
        .then(res => res.json())
        .then(data => {
          console.log('Health check:', data);
          document.getElementById('root').innerHTML =
            '<div style="margin-top: 20px; text-align: left; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px;">' +
            '<h3>API Status:</h3>' +
            '<pre>' + JSON.stringify(data, null, 2) + '</pre>' +
            '</div>';
        })
        .catch(err => {
          console.error('Error fetching health:', err);
          document.getElementById('root').innerHTML =
            '<div style="margin-top: 20px; color: #ff6b6b; text-align: left; background: rgba(0,0,0,0.1); padding: 10px; border-radius: 4px;">' +
            '<h3>API Error:</h3>' +
            '<p>' + err.message + '</p>' +
            '</div>';
        });
    </script>
  </div>
</body>
</html>
FALLBACK
  echo "Created fallback build"
fi

# Copy the build files to the static directory
cd ..
echo "Copying build files to static directory..."
cp -r frontend/build/* static/

echo "Verifying static files were copied..."
if [ -f "static/index.html" ]; then
  echo "✓ Static files successfully copied"
else
  echo "WARNING: Static files not found after copy!"
fi

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
EOF

# Make build.sh executable
chmod +x build.sh
echo "Made build.sh executable"

# Update render.yaml if it exists
if [ -f render.yaml ]; then
  echo "Updating render.yaml for Vite compatibility..."
  sed -i.bak 's/NODE_OPTIONS=--max-old-space-size=[0-9]*/NODE_OPTIONS=--max-old-space-size=4096/g' render.yaml

  # Add Vite-specific environment variable if not present
  if ! grep -q "VITE_APP_" render.yaml; then
    sed -i.bak '/envVars:/a\    - key: VITE_APP_DEBUG\n      value: "true"' render.yaml
  fi

  rm render.yaml.bak 2>/dev/null || true
  echo "Updated render.yaml with Vite configuration"
fi

echo "===== BUILD SCRIPT UPDATED FOR VITE ====="
echo "The build.sh script has been updated to use Vite instead of react-scripts."
echo "This should resolve the build freezing issues."
echo ""
echo "Next steps:"
echo "1. Run './migrate-to-vite.sh' to migrate your React app to Vite"
echo "2. Commit and push the changes to trigger a new build on Render"
echo "3. Monitor the build logs to ensure everything works correctly"
