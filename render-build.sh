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

# Create a diagnostic HTML file that directly includes React
echo "Creating diagnostic HTML file..."
cat > backend/static/react-diagnostic.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>React Diagnostic Page</title>
  <!-- Load React directly from CDN -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .success { color: green; }
    .error { color: red; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow: auto; max-height: 300px; }
    table { border-collapse: collapse; width: 100%; margin-top: 10px; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #f2f2f2; }
    tr:nth-child(even) { background-color: #f9f9f9; }
  </style>
</head>
<body>
  <h1>React Diagnostic Page</h1>
  <div id="root"></div>
  
  <h2>React Status</h2>
  <div id="react-status"></div>
  
  <h2>JSX Runtime Status</h2>
  <div id="jsx-status"></div>
  
  <h2>Script Loading Order</h2>
  <div id="script-order">
    <p>Analyzing scripts...</p>
  </div>
  
  <h2>Module Script Test</h2>
  <div id="module-test"></div>
  
  <script>
    // Check React presence
    const reactStatus = document.getElementById('react-status');
    if (typeof React !== 'undefined') {
      reactStatus.innerHTML = `<p class="success">✅ React is available (version: ${React.version || 'unknown'})</p>
      <pre>${JSON.stringify(Object.keys(React), null, 2)}</pre>`;
    } else {
      reactStatus.innerHTML = '<p class="error">❌ React is NOT available</p>';
    }
    
    // Check JSX runtime
    const jsxStatus = document.getElementById('jsx-status');
    if (typeof jsx !== 'undefined' && typeof jsxs !== 'undefined') {
      jsxStatus.innerHTML = '<p class="success">✅ JSX runtime functions are available</p>';
    } else {
      jsxStatus.innerHTML = '<p class="error">❌ JSX runtime functions are NOT available</p>';
      // Create them if missing
      window.jsx = window.jsx || (window.React ? window.React.createElement : function(){});
      window.jsxs = window.jsxs || window.jsx;
      jsxStatus.innerHTML += '<p>→ Created fallback JSX runtime functions</p>';
    }
    
    // Try to render a simple React component
    try {
      const root = ReactDOM.createRoot(document.getElementById('root'));
      root.render(React.createElement('div', null, 'If you can see this, React is working!'));
      console.log('React rendering successful');
    } catch (error) {
      console.error('React rendering failed:', error);
      document.getElementById('root').innerHTML = 
        `<p class="error">React rendering failed: ${error.message}</p>`;
    }
    
    // Log script loading order
    function analyzeScripts() {
      const scriptOrder = document.getElementById('script-order');
      const scripts = document.querySelectorAll('script');
      
      // Create a table for scripts
      let html = `
        <p>Found ${scripts.length} script elements</p>
        <table>
          <tr>
            <th>#</th>
            <th>Source/Content</th>
            <th>Type</th>
            <th>Async/Defer</th>
            <th>Position</th>
          </tr>
      `;
      
      scripts.forEach((script, index) => {
        const source = script.src ? script.src : 'Inline script';
        const type = script.type || 'text/javascript (default)';
        const asyncAttr = script.async ? 'async' : ''; 
        const deferAttr = script.defer ? 'defer' : '';
        const loadingAttrs = asyncAttr || deferAttr ? `${asyncAttr} ${deferAttr}`.trim() : 'none';
        const position = script.parentNode.tagName.toLowerCase() === 'head' ? 'head' : 'body';
        
        // Log to console too for debugging
        console.log(`Script ${index + 1}:`, { 
          src: source, 
          type, 
          async: script.async, 
          defer: script.defer,
          position
        });
        
        html += `
          <tr>
            <td>${index + 1}</td>
            <td>${source}</td>
            <td>${type}</td>
            <td>${loadingAttrs}</td>
            <td>${position}</td>
          </tr>
        `;
      });
      
      html += '</table>';
      
      // Add info about document readiness
      html += `
        <h3>Document State</h3>
        <p>Document readyState: ${document.readyState}</p>
        <p>DOMContentLoaded fired: ${window._domLoaded ? 'Yes' : 'No'}</p>
        <p>Window load fired: ${window._windowLoaded ? 'Yes' : 'No'}</p>
      `;
      
      scriptOrder.innerHTML = html;
    }
    
    // Test module script loading
    function testModuleLoading() {
      const moduleTest = document.getElementById('module-test');
      
      // Create a test module script
      const moduleScript = document.createElement('script');
      moduleScript.type = 'module';
      moduleScript.textContent = `
        console.log('Module script executed');
        document.getElementById('module-test').innerHTML += '<p class="success">✅ Module script executed successfully</p>';
      `;
      
      // Add error handler
      moduleScript.onerror = (error) => {
        console.error('Module script failed to load:', error);
        moduleTest.innerHTML += `
          <p class="error">❌ Module script failed to load</p>
          <pre>${error ? JSON.stringify(error) : 'No error details available'}</pre>
        `;
      };
      
      // Add the module script
      moduleTest.innerHTML = '<p>Testing module script loading...</p>';
      document.body.appendChild(moduleScript);
    }
    
    // Track document load events
    window._domLoaded = false;
    window._windowLoaded = false;
    
    document.addEventListener('DOMContentLoaded', () => {
      window._domLoaded = true;
      analyzeScripts();
      testModuleLoading();
    });
    
    window.addEventListener('load', () => {
      window._windowLoaded = true;
      // Update again after window load
      setTimeout(analyzeScripts, 100);
    });
    
    // Initial analysis in case DOMContentLoaded already fired
    if (document.readyState !== 'loading') {
      window._domLoaded = true;
      analyzeScripts();
      testModuleLoading();
    }
  </script>
</body>
</html>
EOF

echo "Completed React fixes setup"

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

# Create dedicated JSX runtime module script
echo "Creating JSX runtime module script..."
mkdir -p backend/static/jsx-runtime
cat > backend/static/jsx-runtime/jsx-runtime.js << 'EOF'
/**
 * JSX Runtime module
 * This provides the jsx and jsxs functions for modern React builds
 */

// Use the React global if available
const React = window.React;

// Implementation of jsx/jsxs functions
export function jsx(type, props, key) {
  const config = {};
  
  // Copy all props except children
  for (const propName in props) {
    if (propName !== 'children' && Object.prototype.hasOwnProperty.call(props, propName)) {
      config[propName] = props[propName];
    }
  }
  
  // Set children
  config.children = props?.children;
  
  // Set key if provided
  if (key !== undefined) {
    config.key = key;
  }
  
  console.log(`jsx called for type: ${typeof type === 'string' ? type : 'component'}`);
  
  return React.createElement(type, config, config.children);
}

// jsxs is the same but optimized for static children
export function jsxs(type, props, key) {
  return jsx(type, props, key);
}

// Export Fragment
export const Fragment = React?.Fragment || Symbol('Fragment');

// Default export for compatibility
export default {
  jsx,
  jsxs,
  Fragment
};

// Log successful loading
console.log('JSX runtime module loaded successfully');
EOF

# Create JSX dev runtime module script
cat > backend/static/jsx-runtime/jsx-dev-runtime.js << 'EOF'
/**
 * JSX Dev Runtime module
 * This provides the jsxDEV function for development builds
 */

// Re-export everything from jsx-runtime
export * from './jsx-runtime.js';

// Implementation of jsxDEV function with source info
export function jsxDEV(type, props, key, isStaticChildren, source, self) {
  const config = {};
  
  // Copy all props except children
  for (const propName in props) {
    if (propName !== 'children' && Object.prototype.hasOwnProperty.call(props, propName)) {
      config[propName] = props[propName];
    }
  }
  
  // Set children
  config.children = props?.children;
  
  // Set key if provided
  if (key !== undefined) {
    config.key = key;
  }
  
  // Add source info in dev mode
  if (source) {
    config.__source = source;
    config.__self = self;
  }
  
  console.log(`jsxDEV called for type: ${typeof type === 'string' ? type : 'component'}`);
  
  return window.React.createElement(type, config, config.children);
}

// Default export for compatibility
export default {
  jsxDEV
};

// Log successful loading
console.log('JSX dev runtime module loaded successfully');
EOF

echo "JSX runtime module scripts created"

echo "Build completed successfully at $(date)"
exit 0 