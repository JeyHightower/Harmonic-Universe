#!/bin/bash
# build.sh - Comprehensive build script for Render deployment

set -e # Exit on error

echo "Starting Harmonic Universe build process..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version || echo 'Node not found')"

# Set environment variables for deployment
export RENDER=true
export FLASK_ENV=production
export FLASK_DEBUG=0
export VITE_APP_ENV=production
export VITE_USE_HASH_ROUTER=true
export ROLLUP_DISABLE_NATIVE=true

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Ensure backend app static directory exists
mkdir -p backend/app/static

# Build frontend
echo "Building frontend assets..."
if [ -d "frontend" ]; then
  # First ensure we're in the root directory
  ROOT_DIR=$(pwd)
  
  # Run both fix scripts if they exist
  if [ -f "scripts/fix/fix-jsx-extension.sh" ]; then
    echo "Running JSX extension fixes..."
    bash scripts/fix/fix-jsx-extension.sh
  else
    echo "JSX extension fix script not found, continuing without fixes"
  fi
  
  if [ -f "scripts/fix/fix-react-errors.sh" ]; then
    echo "Running React error fixes..."
    bash scripts/fix/fix-react-errors.sh
  else
    echo "React error fix script not found, continuing without fixes"
  fi
  
  # If the deployment fix script exists, run it as well
  if [ -f "scripts/fix/fix-deployment.sh" ]; then
    echo "Running deployment fixes..."
    bash scripts/fix/fix-deployment.sh
  else
    echo "Deployment fix script not found, continuing without fixes"
  fi
  
  cd frontend
  
  # Fix main.jsx syntax error
  if [ -f "src/main.jsx" ]; then
    echo "Checking and fixing main.jsx..."
    # Fix the incorrect "from" syntax if present
    sed -i "s/import { AUTH_CONFIG } 'from/import { AUTH_CONFIG } from/g" src/main.jsx
    sed -i "s/'from '.\/utils\/config.jsx'/from '.\/utils\/config.jsx'/g" src/main.jsx
    sed -i "s/'from '.\/utils\/config'/from '.\/utils\/config'/g" src/main.jsx
    # Make general fixes to import statements
    sed -i "s/} 'from/} from/g" src/main.jsx
    echo "Fixed main.jsx import statements"
  fi
  
  # Fix App.jsx syntax error
  if [ -f "src/App.jsx" ]; then
    echo "Checking and fixing App.jsx..."
    # Fix the incorrect "from" syntax if present
    sed -i "s/import ModalProvider 'from/import ModalProvider from/g" src/App.jsx
    sed -i "s/'from '.\/components\/modals\/ModalProvider.jsx'/from '.\/components\/modals\/ModalProvider.jsx'/g" src/App.jsx
    sed -i "s/'from '.\/components\/modals\/ModalProvider'/from '.\/components\/modals\/ModalProvider'/g" src/App.jsx
    # Make general fixes to import statements
    sed -i "s/} 'from/} from/g" src/App.jsx
    sed -i "s/ 'from / from /g" src/App.jsx
    echo "Fixed App.jsx import statements"
  fi
  
  # Fix authSlice.js specifically
  if [ -f "src/store/slices/authSlice.js" ]; then
    echo "Checking and fixing authSlice.js..."
    sed -i "s/} 'from /} from /g" src/store/slices/authSlice.js
    sed -i "s/'from '/from '/g" src/store/slices/authSlice.js
    echo "Fixed authSlice.js import statements"
  fi
  
  # General fix for all JSX files
  echo "Applying general import statement fixes to all JSX files..."
  find src -name "*.jsx" -exec sed -i "s/ 'from / from /g" {} \;
  find src -name "*.jsx" -exec sed -i "s/} 'from/} from/g" {} \;
  find src -name "*.jsx" -exec sed -i "s/'from /from /g" {} \;
  
  # General fix for all JS files too
  echo "Applying general import statement fixes to all JS files..."
  find src -name "*.js" -exec sed -i "s/ 'from / from /g" {} \;
  find src -name "*.js" -exec sed -i "s/} 'from/} from/g" {} \;
  find src -name "*.js" -exec sed -i "s/'from /from /g" {} \;
  
  # Install all needed dependencies explicitly
  echo "Installing frontend dependencies..."
  
  # Install build tools first
  npm install vite@4.5.2 @vitejs/plugin-react@4.0.3 --save-dev
  
  # Install React and core dependencies first
  npm install react@18.2.0 react-dom@18.2.0 react-router-dom@6.18.0 react-redux@8.1.3 @reduxjs/toolkit@1.9.5 redux-persist@6.0.0 prop-types@15.8.1 --save
  
  # Install UI libraries
  npm install @mui/material@5.14.15 @mui/icons-material@5.14.15 @emotion/react@11.11.1 @emotion/styled@11.11.0 --save
  
  # Install antd - now required by the LoginModal component
  npm install antd@4.24.12 @ant-design/icons@4.8.0 --save
  
  # Create a comprehensive vite config with module handling
  cat > vite.config.js << 'EOF'
// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      external: [
        // Mark problematic modules as external if needed
        'prop-types'
      ]
    }
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      'src': resolve(__dirname, 'src'),
      './pages/auth/LoginPage': resolve(__dirname, 'src/pages/LoginPage'),
      './pages/Dashboard': resolve(__dirname, 'src/features/Dashboard')
    },
    extensions: ['.mjs', '.js', '.jsx', '.ts', '.tsx', '.json']
  },
  optimizeDeps: {
    include: ['prop-types', 'react-redux', '@mui/material', '@mui/icons-material', 'antd', '@ant-design/icons']
  },
  esbuild: {
    loader: 'jsx',
    include: /src\/.*\.jsx?$/,
    exclude: [],
  }
});
EOF
  
  # Fix imports in router.jsx if it exists
  if [ -f "src/router.jsx" ]; then
    echo "Fixing imports in router.jsx..."
    sed -i.bak 's|from "./pages/Dashboard"|from "./features/Dashboard"|g' src/router.jsx
    sed -i.bak 's|from "./pages/auth/LoginPage"|from "./pages/LoginPage"|g' src/router.jsx
    sed -i.bak 's|from "./pages/auth/RegisterPage"|from "./pages/LoginPage"|g' src/router.jsx
    # Fix other imports for scene, universe, etc.
    sed -i.bak 's|from "./pages/universe/UniverseDetail"|from "./features/UniverseDetail"|g' src/router.jsx
    sed -i.bak 's|from "./pages/scenes/SceneDetail"|from "./components/consolidated/SceneDetail"|g' src/router.jsx
    sed -i.bak 's|from "./pages/scenes/SceneEditPage"|from "./components/consolidated/SceneEditPage"|g' src/router.jsx
    sed -i.bak 's|from "./pages/scenes/SceneEditRedirect"|from "./components/routing/SceneEditRedirect"|g' src/router.jsx
    rm -f src/router.jsx.bak
  fi
  
  # Run vite build with source maps
  echo "Building frontend production bundle..."
  NODE_OPTIONS="--max-old-space-size=4096" npx vite build --emptyOutDir
  
  # Copy built files to static directory
  echo "Copying built files to Flask app static directory..."
  if [ -d "dist" ]; then
    cp -r dist/* "$ROOT_DIR/backend/app/static/"
    echo "Copied files from dist/ to backend/app/static/"
    
    # Also copy to root static for fallback
    mkdir -p "$ROOT_DIR/static"
    cp -r dist/* "$ROOT_DIR/static/"
    echo "Copied files from dist/ to static/ (fallback)"
  else
    echo "WARNING: No dist directory found after build"
    ls -la
  fi
  
  # Return to root directory
  cd "$ROOT_DIR"
else
  echo "No frontend directory found, skipping frontend build"
fi

# Ensure static directory exists and has an index.html
if [ ! -f "backend/app/static/index.html" ]; then
  echo "No index.html found in backend/app/static directory, creating a placeholder"
  
  cat > backend/app/static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #3498db; }
    </style>
    <script>
        // Handle SPA routing for deep links
        (function() {
            // Redirect all 404s back to index.html for client-side routing
            if (window.location.pathname !== '/' && !window.location.pathname.startsWith('/api/')) {
                console.log('SPA routing: handling deep link:', window.location.pathname);
                // History is preserved when using pushState
                window.history.pushState({}, '', '/');
            }
        })();
    </script>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>The application is running. Please check the API status below:</p>
        <div id="status">Checking API...</div>
    </div>
    <script>
        // Check API health
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:green">API is running: ' + 
                    JSON.stringify(data) + '</strong>';
            })
            .catch(error => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:red">Error connecting to API: ' + 
                    error.message + '</strong>';
            });
    </script>
</body>
</html>
EOF
fi

# Check if there's an index.html in the secondary static folder, copy if not
if [ ! -f "static/index.html" ] && [ -f "backend/app/static/index.html" ]; then
  mkdir -p static
  cp -r backend/app/static/* static/
  echo "Copied index.html to static/ directory (secondary location)"
fi

# Copy static files to expected Render location for redundancy
mkdir -p /opt/render/project/src/static || echo "Could not create directory (normal for local build)"
cp -r backend/app/static/* /opt/render/project/src/static/ || echo "Warning: Could not copy to Render path"

# Set up database if needed
echo "Setting up database..."
export FLASK_APP=backend.app:create_app

# Run database migrations
echo "Running database migrations..."
cd backend
python -m flask db upgrade || echo "Warning: Database migrations failed, continuing"
cd ..

echo "Build process completed successfully" 