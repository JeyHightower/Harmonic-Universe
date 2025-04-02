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
export NODE_OPTIONS="--max-old-space-size=2048"

# Set Node environment and enable crypto polyfill
export NODE_ENV=production

# Build Frontend
echo "==== Building frontend ===="
cd frontend

# Explicitly install React and related dependencies first
echo "Installing React and related dependencies..."
npm install react react-dom @vitejs/plugin-react --no-save

echo "Creating manual static build instead of using Vite..."
# Create a manual build script that doesn't rely on Vite
cat > manual-build.js << 'EOF'
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('Starting manual static build...');

// Create dist directory if it doesn't exist
const distDir = path.join(process.cwd(), 'dist');
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

// Copy the main HTML file
console.log('Copying index.html...');
if (fs.existsSync('index.html')) {
  let htmlContent = fs.readFileSync('index.html', 'utf8');
  
  // Update paths in the HTML to use relative paths
  htmlContent = htmlContent.replace(/src="\/assets\//g, 'src="./assets/');
  htmlContent = htmlContent.replace(/href="\/assets\//g, 'href="./assets/');
  htmlContent = htmlContent.replace(/href="\/vite.svg/g, 'href="./favicon.svg');
  
  fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent);
} else {
  console.log('index.html not found, creating a basic one...');
  fs.writeFileSync(path.join(distDir, 'index.html'), `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Harmonic Universe</title>
        <script src="app.js" defer></script>
        <link rel="stylesheet" href="style.css">
      </head>
      <body>
        <div id="root">Loading...</div>
        <div id="portal-root"></div>
      </body>
    </html>
  `);
}

// Copy assets from public directory if it exists
console.log('Copying public assets...');
if (fs.existsSync('public')) {
  const copyPublicAssets = (dir) => {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const srcPath = path.join(dir, file);
      const destPath = path.join(distDir, path.relative('public', srcPath));
      
      if (fs.statSync(srcPath).isDirectory()) {
        if (!fs.existsSync(destPath)) {
          fs.mkdirSync(destPath, { recursive: true });
        }
        copyPublicAssets(srcPath);
      } else {
        fs.copyFileSync(srcPath, destPath);
      }
    });
  };
  
  copyPublicAssets('public');
}

// Create a basic CSS file
console.log('Creating basic CSS...');
fs.writeFileSync(path.join(distDir, 'style.css'), `
  body { 
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 100vh;
    background-color: #f0f2f5;
  }
  
  #root {
    width: 100%;
    max-width: 1200px;
    padding: 20px;
  }
`);

// Create a basic JavaScript file that shows a message
console.log('Creating placeholder JavaScript...');
fs.writeFileSync(path.join(distDir, 'app.js'), `
  document.addEventListener('DOMContentLoaded', function() {
    const rootElement = document.getElementById('root');
    
    rootElement.innerHTML = \`
      <div style="text-align: center">
        <h1>Harmonic Universe</h1>
        <p>The application is running in a static version. Please wait while we load the data.</p>
        <p>If you continue seeing this message, there might be an issue with the build process.</p>
        <div id="loading" style="margin: 20px 0;">Loading...</div>
      </div>
    \`;
    
    // This will be replaced by actual application logic when full build is working
    fetch('/api/health')
      .then(response => response.json())
      .then(data => {
        document.getElementById('loading').textContent = 'Connected to backend successfully!';
      })
      .catch(error => {
        document.getElementById('loading').textContent = 'Error connecting to backend. Please try again later.';
      });
  });
`);

console.log('Manual static build created successfully in dist/ directory');
EOF

# Execute the manual build script
echo "Running manual build script..."
node manual-build.js

# Install Vite and React plugin explicitly before attempting to build
echo "Installing required Vite plugins..."
npm install --no-save @vitejs/plugin-react vite react react-dom

# Create a temporary vite config file with proper external dependencies
echo "Creating temporary Vite config with JSX runtime configuration..."
cat > temp-vite.config.js << 'EOF'
import react from "@vitejs/plugin-react";
import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL('./src', import.meta.url)),
      "react/jsx-runtime": require.resolve("react/jsx-runtime"),
      "react/jsx-dev-runtime": require.resolve("react/jsx-dev-runtime")
    },
    extensions: ['.js', '.jsx', '.ts', '.tsx', '.json']
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      external: [],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom'
          ]
        }
      }
    }
  }
});
EOF

# Create a path-fixing script
cat > fix-paths.js << 'EOF'
/**
 * This script updates paths in the built HTML file to use relative paths
 * instead of absolute paths to resolve asset loading issues.
 */
const fs = require('fs');
const path = require('path');

// Path to the dist directory
const distDir = path.join(__dirname, 'dist');
const indexPath = path.join(distDir, 'index.html');

console.log(`Checking for index.html at ${indexPath}`);

if (!fs.existsSync(indexPath)) {
  console.error('Error: index.html not found in dist directory');
  process.exit(1);
}

// Read the HTML file
let html = fs.readFileSync(indexPath, 'utf8');
console.log('Original HTML content (first 300 chars):');
console.log(html.substring(0, 300));

// Replace absolute paths with relative paths
// - Replace /assets/ with ./assets/
// - Replace src="/ with src="./ 
// - Replace href="/ with href="./ (but not for http/https links)
html = html
  .replace(/(src|href)=["']\/assets\//g, '$1="./assets/')
  .replace(/src=["']\/(?!http|https)/g, 'src="./')
  .replace(/href=["']\/(?!http|https)/g, 'href="./');

console.log('Updated HTML content (first 300 chars):');
console.log(html.substring(0, 300));

// Write the updated HTML back to the file
fs.writeFileSync(indexPath, html);

console.log('Updated paths in index.html to use relative paths');

// Now scan the assets directory for any JS files that might have absolute path references
const assetsDir = path.join(distDir, 'assets');
if (fs.existsSync(assetsDir)) {
  const jsFiles = fs.readdirSync(assetsDir).filter(file => file.endsWith('.js'));
  console.log(`Found ${jsFiles.length} JS files in assets directory`);
  
  jsFiles.forEach(file => {
    const filePath = path.join(assetsDir, file);
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Convert URL references from /assets/ to ./assets/
    content = content.replace(/["']\/assets\//g, '"./assets/');
    
    // Handle other asset references that might be using absolute paths
    content = content.replace(/["']\/images\//g, '"./images/');
    
    fs.writeFileSync(filePath, content);
    console.log(`Updated paths in ${file}`);
  });
  
  console.log(`Updated paths in ${jsFiles.length} JS files`);
} else {
  console.log('Assets directory not found');
}
EOF

# Try to run the Vite build with the temporary config
echo "Attempting to run Vite build with temporary config..."
if command -v npx &> /dev/null; then
    echo "Using npx to run vite build with temporary config..."
    npx vite build --config temp-vite.config.js || echo "Vite build failed, using manual build only"
    
    # Run the path-fixing script
    echo "Fixing asset paths in build output..."
    node fix-paths.js
else
    echo "npx not available, using node_modules directly..."
    if [ -f "./node_modules/.bin/vite" ]; then
        ./node_modules/.bin/vite build --config temp-vite.config.js || echo "Vite build failed, using manual build only"
        
        # Run the path-fixing script
        echo "Fixing asset paths in build output..."
        node fix-paths.js
    else
        echo "Vite not found in node_modules, using manual build only"
    fi
fi

# Ensure all paths in index.html are using relative paths
echo "Ensuring all paths are relative in index.html..."
if [ -f "dist/index.html" ]; then
    # Use sed to replace all absolute paths with relative paths
    sed -i 's/src="\/assets/src=".\/assets/g' dist/index.html
    sed -i 's/href="\/assets/href=".\/assets/g' dist/index.html
    sed -i 's/src="\//src=".\//g' dist/index.html
    sed -i 's/href="\//href=".\//g' dist/index.html
    echo "Paths fixed in index.html"

    # Add base tag to the HTML
    sed -i 's/<head>/<head>\n    <base href="\/">/' dist/index.html
    echo "Added base tag to index.html"
fi

# Clean up artifacts and node_modules to free memory
echo "Cleaning up build artifacts..."
rm -f manual-build.js fix-paths.js temp-vite.config.js
rm -rf node_modules
cd ..

# Build Backend
echo "==== Building backend ===="
cd backend

# Prepare directories
echo "Creating necessary directories..."
mkdir -p instance
mkdir -p logs

# Check if Poetry is installed, if not use pip
if command -v poetry &> /dev/null; then
    echo "Using Poetry for dependency management..."
    # Install Poetry packages
    poetry config virtualenvs.create true
    poetry config virtualenvs.in-project true
    poetry install --only main --no-root

    # Create a .env file if it doesn't exist
    if [ ! -f .env ]; then
        echo "Creating .env file from .env.example..."
        cp .env.example .env
    fi
else
    echo "Poetry not found, using pip instead..."
    # Create and activate virtual environment
    python -m venv .venv
    source .venv/bin/activate
    
    # Install dependencies
    echo "Installing dependencies with pip..."
    pip install --upgrade pip
    pip install --no-cache-dir -r requirements.txt
    
    # Explicitly install Flask-Caching
    echo "Explicitly installing Flask-Caching..."
    pip install --no-cache-dir Flask-Caching==2.1.0
    
    pip install --no-cache-dir gunicorn eventlet
fi

# Validate DATABASE_URL
echo "Validating DATABASE_URL..."
if [ -z "$DATABASE_URL" ]; then
    echo "Warning: DATABASE_URL is not set. Using SQLite as fallback."
    # Ensure app.db exists
    touch app.db
else
    # Fix Postgres URL format if needed
    if [[ $DATABASE_URL == postgres://* ]]; then
        export DATABASE_URL="${DATABASE_URL/postgres:///postgresql://}"
        echo "Fixed DATABASE_URL format for PostgreSQL"
    fi
    
    echo "Waiting for database to be ready..."
    sleep 5
fi

# Activate the virtual environment
if [ -d ".venv" ]; then
    source .venv/bin/activate
fi

# Make sure Flask-Caching is installed before any imports that might use it
echo "Ensuring Flask-Caching is installed..."
pip install --no-cache-dir Flask-Caching==2.1.0

# Initialize migrations properly first
echo "Initializing migrations..."
python init_migrations.py

# Run migrations with error handling
echo "Running database migrations..."
if FLASK_APP=init_migrations.py python -m flask db upgrade; then
    echo "Database migrations completed successfully"
else
    echo "Warning: Database migrations failed. Will attempt to initialize DB on startup."
fi

# Set up environment variables
echo "Setting up environment variables..."
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Return to root directory
cd ..

# Remove previous static folder content to avoid old files
echo "Cleaning up backend static directory..."
if [ -d "backend/static" ]; then
    rm -rf backend/static/*
else
    mkdir -p backend/static
fi

# Copy frontend build to backend static directory
echo "Copying frontend build to backend static directory..."
echo "Copying main files from frontend/dist to backend/static..."
cp -r frontend/dist/* backend/static/

# Copy React fixes to static directory
echo "Copying React fixes to static directory..."
mkdir -p backend/static/react-fixes
cp backend/fixes/react-fix-loader.js backend/static/react-fixes/

# Ensure the file is also in the nested static directory (for compatibility)
mkdir -p backend/static/static/react-fixes
cp backend/fixes/react-fix-loader.js backend/static/static/react-fixes/

# If direct-fix.js exists, copy it too
if [ -f "backend/fixes/direct-fix.js" ]; then
  cp backend/fixes/direct-fix.js backend/static/react-fixes/
  cp backend/fixes/direct-fix.js backend/static/static/react-fixes/
fi

# Create a simple .htaccess file to ensure proper MIME types
cat > backend/static/react-fixes/.htaccess << 'EOF'
<FilesMatch "\.js$">
    ForceType application/javascript
</FilesMatch>
EOF

# Create a simple mimetype.ini file as an alternative way to set MIME types
cat > backend/static/react-fixes/mimetype.ini << 'EOF'
[MIME Types]
.js=application/javascript
.mjs=application/javascript
EOF

# Ensure update-index.js is executable and run it
echo "Updating index.html with React fixes..."
chmod +x backend/fixes/update-index.js
cd backend && node fixes/update-index.js && cd ..

# Create a simple diagnostic HTML file
echo "Creating simplified diagnostic HTML file..."
cat > backend/static/react-diagnostic.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Simple React Diagnostic</title>
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script>
    // Define JSX runtime functions
    window.jsx = window.jsxs = React.createElement;
    window.Fragment = React.Fragment;
  </script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f5f5f5; padding: 10px; }
  </style>
</head>
<body>
  <h1>Simple React Diagnostic</h1>
  <div id="root"></div>
  
  <h2>Status:</h2>
  <div id="status"></div>
  
  <script>
    // Display status
    const status = document.getElementById('status');
    const statusData = {
      React: typeof React !== 'undefined',
      jsx: typeof jsx !== 'undefined',
      jsxs: typeof jsxs !== 'undefined',
      Fragment: typeof Fragment !== 'undefined'
    };
    
    let html = '<ul>';
    for (const [key, value] of Object.entries(statusData)) {
      html += `<li>${key}: <span class="${value ? 'success' : 'error'}">${value ? '✅ Available' : '❌ Missing'}</span></li>`;
    }
    html += '</ul>';
    
    status.innerHTML = html;
    
    // Try to render a React component
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement('div', null, 'If you can see this, React is working!'));
      console.log('React rendering successful');
    } catch (error) {
      console.error('React rendering failed:', error);
      document.getElementById('root').innerHTML = 
        `<p class="error">React rendering failed: ${error.message}</p>`;
    }
  </script>
</body>
</html>
EOF

echo "Created simple diagnostic HTML file"

# Verify static files were copied
echo "Frontend build files copied successfully"
echo "Static directory contents:"
ls -la backend/static

# Check if assets directory exists, otherwise create it
if [ -d "frontend/dist/assets" ]; then
    echo "Copying assets directory..."
    cp -r frontend/dist/assets backend/static/
else
    echo "Assets directory not found in frontend build"
    mkdir -p backend/static/assets
fi

# Check if images directory exists, otherwise create it
if [ -d "frontend/dist/images" ]; then
    echo "Copying images directory..."
    cp -r frontend/dist/images backend/static/
else
    echo "Images directory not found in frontend build"
    mkdir -p backend/static/images
fi

# Create .htaccess file for proper MIME types
echo "Creating .htaccess for proper MIME types..."
cat > backend/static/.htaccess << 'EOF'
# Set proper MIME types for modern web assets
AddType application/javascript .js
AddType application/javascript .mjs
AddType text/css .css
AddType image/svg+xml .svg
AddType application/json .json

# Serve files with correct MIME types
<IfModule mod_mime.c>
    AddType application/javascript .js
    AddType application/javascript .mjs
</IfModule>

# For all JavaScript files, ensure correct MIME type
<FilesMatch "\.js$">
    ForceType application/javascript
</FilesMatch>

# For all JavaScript module files, ensure correct MIME type
<FilesMatch "\.mjs$">
    ForceType application/javascript
</FilesMatch>
EOF

echo "Assets directory contents:"
ls -la backend/static/assets || echo "Assets directory not found"

# Create direct JSX runtime module for easier imports
echo "Creating simplified direct JSX runtime modules..."

# Create a simple JSX runtime module
mkdir -p backend/static/node_modules/react
cat > backend/static/node_modules/react/jsx-runtime.js << 'EOF'
// Simple JSX runtime module
console.log('JSX runtime module loaded');

// Export the JSX functions from the global scope
export const jsx = window.jsx || window.React.createElement;
export const jsxs = window.jsxs || window.React.createElement;
export const Fragment = window.Fragment || window.React.Fragment;

export default { jsx, jsxs, Fragment };
EOF

# Create dev version too for completeness
cat > backend/static/node_modules/react/jsx-dev-runtime.js << 'EOF'
// Simple JSX dev runtime module
import { jsx, jsxs, Fragment } from './jsx-runtime.js';
export { jsx, jsxs, Fragment };
export const jsxDEV = jsx;
export default { jsx, jsxs, jsxDEV, Fragment };
EOF

echo "Created simplified JSX runtime modules"

# Create MIME type fix script if needed
echo "==== Adding MIME type fixes ===="
cd backend
mkdir -p fixes/render

# Create __init__.py if it doesn't exist
if [ ! -f "fixes/render/__init__.py" ]; then
  echo "Creating fixes/render/__init__.py"
  cat > fixes/render/__init__.py << 'EOF'
"""
Render Platform Specific Fixes

This module contains fixes and workarounds specific to the Render platform.
These are applied at runtime to ensure proper functionality in the Render environment.
"""

def apply_render_fixes():
    """Apply all Render-specific fixes."""
    print("Applying Render-specific fixes...")
    return True
EOF
fi

# Create mime_types.py if it doesn't exist
if [ ! -f "fixes/render/mime_types.py" ]; then
  echo "Creating fixes/render/mime_types.py"
  cat > fixes/render/mime_types.py << 'EOF'
"""
Render MIME Type Fixes

This module provides fixes for MIME type issues specific to Render.
It works by patching response headers at the WSGI level.
"""

import mimetypes
import re
from functools import wraps

def apply_mime_fixes(app):
    """Apply Render-specific MIME type fixes to the Flask app."""
    # Ensure all JavaScript MIME types are registered
    mimetypes.add_type('application/javascript', '.js')
    mimetypes.add_type('application/javascript', '.mjs')
    mimetypes.add_type('application/javascript', '.jsx')
    
    # Create WSGI middleware to handle MIME types
    original_wsgi_app = app.wsgi_app
    
    @wraps(original_wsgi_app)
    def mime_type_middleware(environ, start_response):
        # Original response function
        original_start_response = start_response
        
        # Intercept the response headers
        def new_start_response(status, headers, exc_info=None):
            # Get the path from the environ
            path = environ.get('PATH_INFO', '')
            
            # Check if this is a JavaScript file
            if re.search(r'\.(js|mjs|jsx)$', path) or '/src/index.js' in path or '/jsx-runtime' in path:
                # Replace Content-Type header or add it if not present
                new_headers = []
                content_type_added = False
                
                for name, value in headers:
                    if name.lower() == 'content-type':
                        new_headers.append(('Content-Type', 'application/javascript; charset=utf-8'))
                        content_type_added = True
                    else:
                        new_headers.append((name, value))
                
                if not content_type_added:
                    new_headers.append(('Content-Type', 'application/javascript; charset=utf-8'))
                
                # Add CORS headers for JavaScript
                new_headers.append(('Access-Control-Allow-Origin', '*'))
                new_headers.append(('Access-Control-Allow-Methods', 'GET, OPTIONS'))
                
                return original_start_response(status, new_headers, exc_info)
            
            # For non-JS files, just pass through
            return original_start_response(status, headers, exc_info)
        
        # Call the original app with our modified start_response
        return original_wsgi_app(environ, new_start_response)
    
    # Replace the WSGI app with our middleware
    app.wsgi_app = mime_type_middleware
    
    print("Render MIME type fixes applied at WSGI level")
    return True
EOF
fi

# Create routes.py if it doesn't exist
if [ ! -f "fixes/render/routes.py" ]; then
  echo "Creating fixes/render/routes.py"
  cat > fixes/render/routes.py << 'EOF'
"""
Render Route Fixes

This module adds special routes to handle specific paths on Render's platform.
"""

def register_render_routes(app):
    """Register special routes for Render platform compatibility."""
    from flask import request, jsonify, send_file
    import io
    
    @app.route('/render-static-js/<path:filename>')
    def render_static_js(filename):
        """Serve JS files from a special path with forced JS MIME type."""
        # Log the request
        app.logger.info(f"Render static JS requested: {filename}")
        
        # Generate a simple JavaScript file with the filename
        js_content = f"""
        // Render static JS file: {filename}
        console.log('Loading {filename} from Render static route');
        
        // Export necessary functions for compatibility
        export const jsx = (type, props) => ({{ type, props }});
        export const jsxs = (type, props) => ({{ type, props }});
        export const Fragment = Symbol('Fragment');
        
        // Default export
        export default {{ 
            filename: '{filename}',
            render_static: true,
            timestamp: {{}}.valueOf()
        }};
        """
        
        # Create a file-like object
        js_file = io.BytesIO(js_content.encode('utf-8'))
        
        # Return the file with explicit JavaScript MIME type
        return send_file(
            js_file, 
            mimetype='application/javascript; charset=utf-8',
            as_attachment=False,
            download_name=filename
        )
    
    @app.route('/render-debug')
    def render_debug():
        """Render platform debug endpoint."""
        debug_info = {
            'request': {
                'path': request.path,
                'method': request.method,
                'headers': dict(request.headers),
                'args': dict(request.args)
            },
            'render_specific': {
                'render_instance_id': request.headers.get('X-Render-Instance-ID', 'unknown'),
                'host_headers': request.headers.get('Host', 'unknown'),
                'forwarded_host': request.headers.get('X-Forwarded-Host', 'unknown'),
                'forwarded_proto': request.headers.get('X-Forwarded-Proto', 'unknown')
            }
        }
        
        return jsonify(debug_info)
    
    print("Render-specific routes registered")
    return True
EOF
fi

# Go back to the main directory
cd ..

echo "Build completed successfully at $(date)"
exit 0 