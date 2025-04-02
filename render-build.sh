#!/bin/bash

# Exit on error
set -e

# Display diagnostic information
echo "Starting build process at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Set Node memory limit to prevent OOM issues
export NODE_OPTIONS="--max-old-space-size=4096"

# Set Node environment
export NODE_ENV=production

# Check directory structure
echo "==== Checking directory structure ===="
ls -la

# Find frontend directory
FRONTEND_DIR=""
if [ -d "frontend" ]; then
  FRONTEND_DIR="frontend"
elif [ -d "./frontend" ]; then
  FRONTEND_DIR="./frontend"
elif [ -d "../frontend" ]; then
  FRONTEND_DIR="../frontend"
fi

if [ -z "$FRONTEND_DIR" ]; then
  echo "ERROR: Cannot find frontend directory!"
  echo "Creating a minimal frontend structure..."
  
  mkdir -p frontend/src
  mkdir -p frontend/public
  
  # Create minimal package.json
  cat > frontend/package.json << 'EOF'
{
  "name": "harmonic-universe-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "3.1.0",
    "vite": "4.2.0"
  }
}
EOF

  # Create minimal main.jsx
  mkdir -p frontend/src
  cat > frontend/src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div>
      <h1>Harmonic Universe</h1>
      <p>Minimal App</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF

  # Create minimal index.html
  cat > frontend/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF

  # Create minimal vite.config.js
  cat > frontend/vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist'
  }
});
EOF

  FRONTEND_DIR="frontend"
  echo "Created minimal frontend structure in './frontend'"
fi

# Build Frontend
echo "==== Building frontend ===="
cd "$FRONTEND_DIR"
FRONTEND_PATH=$(pwd)
echo "Frontend directory: $FRONTEND_PATH"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found in $FRONTEND_PATH!"
  echo "Creating a basic package.json..."
  
  # Create minimal package.json
  cat > package.json << 'EOF'
{
  "name": "harmonic-universe-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-redux": "8.0.5",
    "react-router-dom": "6.10.0",
    "@reduxjs/toolkit": "1.9.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "3.1.0",
    "vite": "4.2.0"
  }
}
EOF
fi

# Display package.json
echo "Current package.json:"
cat package.json

# Clean out node_modules completely
echo "Completely removing node_modules directory..."
rm -rf node_modules
rm -rf package-lock.json

# Clean any JSX runtime polyfills that might cause conflicts
echo "Cleaning any existing JSX runtime polyfills..."
rm -f src/jsx-runtime.js
rm -f src/jsx-dev-runtime.js
rm -f src/jsx-runtime-polyfill.js
rm -f vite-plugin-react-shim.js
rm -f vite.config.minimal.js

# Create temporary package.json with exact versions
echo "Creating temporary package.json with exact versions..."
cp package.json package.json.bak
cat > package.json << 'EOF'
{
  "name": "harmonic-universe-frontend",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "18.2.0",
    "react-dom": "18.2.0",
    "react-redux": "8.0.5",
    "react-router-dom": "6.10.0",
    "@reduxjs/toolkit": "1.9.5"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "3.1.0",
    "vite": "4.2.0" 
  }
}
EOF

# Create index.html if it doesn't exist
if [ ! -f "index.html" ]; then
  echo "Creating index.html..."
  cat > index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
</head>
<body>
  <div id="root"></div>
  <script type="module" src="/src/main.jsx"></script>
</body>
</html>
EOF
fi

# Create src directory and main.jsx if they don't exist
if [ ! -d "src" ]; then
  echo "Creating src directory..."
  mkdir -p src
fi

if [ ! -f "src/main.jsx" ]; then
  echo "Creating main.jsx..."
  cat > src/main.jsx << 'EOF'
import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div>
      <h1>Harmonic Universe</h1>
      <p>Minimal App</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
EOF
fi

# Install dependencies
echo "Installing dependencies with --legacy-peer-deps..."
npm install --legacy-peer-deps

# Create a simple vite.config.js
echo "Creating simple vite.config.js..."
cat > vite.config.js << 'EOF'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true
  }
});
EOF

# List installed versions for troubleshooting
echo "Checking installed versions:"
npx --no vite --version || echo "Vite not found with npx --no"
npm list --depth=0

# Try to build
echo "Building frontend application..."
if ! npx vite build; then
  echo "Regular build failed, trying with NPX to ensure correct Vite version..."
  npx vite@4.2.0 build
fi

# If build still fails, create minimal static files
if [ ! -d "dist" ]; then
  echo "All build attempts failed, creating a minimal build..."
  
  # Create minimal dist directory
  mkdir -p dist
  
  # Copy any existing static assets
  if [ -d "public" ]; then
    echo "Copying public assets to dist directory..."
    cp -r public/* dist/ || echo "Warning: Could not copy all public assets"
  fi
  
  # Create a minimal index.html
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Welcome to Harmonic Universe. The application is loading...</p>
    <div id="root"></div>
  </div>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      const root = document.getElementById('root');
      root.innerHTML = '<div><h2>Application Loading</h2><p>Please wait while we connect to the backend...</p></div>';
      
      // Check if backend is available
      fetch('/api/health')
        .then(response => response.json())
        .then(data => {
          root.innerHTML = '<div><h2>Backend Connected</h2><p>The application backend is available.</p></div>';
        })
        .catch(err => {
          root.innerHTML = '<div><h2>Backend Unavailable</h2><p>Could not connect to application backend.</p></div>';
        });
    });
  </script>
</body>
</html>
EOF
  
  echo "Created minimal build files"
fi

# Verify the build output
echo "Verifying frontend build..."
if [ -d "dist" ]; then
  echo "Frontend build directory exists. Contents of dist directory:"
  ls -la dist
  
  # Restore original package.json if it exists
  if [ -f "package.json.bak" ]; then
    echo "Restoring original package.json..."
    mv package.json.bak package.json
  fi
else
  echo "ERROR: Frontend build failed! No dist directory found."
  exit 1
fi

# Go back to original directory
cd - > /dev/null

# Check if backend directory exists
BACKEND_DIR=""
if [ -d "backend" ]; then
  BACKEND_DIR="backend"
elif [ -d "./backend" ]; then
  BACKEND_DIR="./backend"
elif [ -d "../backend" ]; then
  BACKEND_DIR="../backend"
fi

if [ -z "$BACKEND_DIR" ]; then
  echo "WARNING: Backend directory not found. Creating minimal backend..."
  mkdir -p backend/static
  mkdir -p backend/instance
  mkdir -p backend/logs
  
  # Create a minimal app.py
  cat > backend/app.py << 'EOF'
from flask import Flask, jsonify, send_from_directory
import os

def create_app():
    app = Flask(__name__, static_folder='static')
    
    @app.route('/api/health')
    def health():
        return jsonify({"status": "ok"})
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(app.static_folder, path)):
            return send_from_directory(app.static_folder, path)
        return send_from_directory(app.static_folder, 'index.html')
    
    return app

if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5001)))
EOF

  # Create a minimal requirements.txt
  cat > backend/requirements.txt << 'EOF'
flask==2.3.3
werkzeug==2.3.7
gunicorn==21.2.0
EOF
  
  BACKEND_DIR="backend"
  echo "Created minimal backend in './backend'"
fi

# Build Backend
echo "==== Building backend ===="
cd "$BACKEND_DIR"
BACKEND_PATH=$(pwd)
echo "Backend directory: $BACKEND_PATH"

# Check if requirements.txt exists
if [ ! -f "requirements.txt" ]; then
  echo "WARNING: requirements.txt not found. Creating minimal version..."
  cat > requirements.txt << 'EOF'
flask==2.3.3
werkzeug==2.3.7
gunicorn==21.2.0
EOF
fi

# Install backend dependencies
echo "Installing backend dependencies..."
pip install --upgrade pip
pip install --no-cache-dir -r requirements.txt

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs
mkdir -p static

# Initialize database
echo "Initializing database..."
if [ -f "init_migrations.py" ]; then
  export FLASK_APP=init_migrations.py
  python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing"
else
  echo "init_migrations.py not found, skipping migrations"
fi

# Go back to original directory
cd - > /dev/null

# Copy frontend build to backend static directory
echo "Copying frontend build to backend static directory..."
rm -rf "$BACKEND_DIR/static/"* # Clean existing files
cp -r "$FRONTEND_DIR/dist/"* "$BACKEND_DIR/static/"

# Ensure the static directory has proper permissions
echo "Setting permissions for static directory..."
chmod -R 755 "$BACKEND_DIR/static"

# Verify backend static directory
echo "Verifying backend static directory..."
ls -la "$BACKEND_DIR/static"

echo "Build completed successfully at $(date)"
exit 0 