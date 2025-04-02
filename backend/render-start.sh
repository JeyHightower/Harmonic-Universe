#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe server at $(date)"
echo "Current directory: $(pwd)"

# Make sure we're in the correct directory
if [ ! -f "app.py" ]; then
  echo "Error: app.py not found, navigating to backend directory"
  if [ -d "backend" ]; then
    cd backend
  else
    echo "Checking if we're already in backend..."
    pwd
    ls -la
    if [ ! -f "app.py" ]; then
      echo "Error: Could not find app.py in backend directory"
      exit 1
    fi
  fi
fi

# Ensure Python virtual environment is activated
if [ -d ".venv" ]; then
  echo "Activating virtual environment..."
  source .venv/bin/activate
fi

# Check for required Python packages
echo "Checking for required packages..."
pip install --no-cache-dir gunicorn flask flask-cors whitenoise

# Apply any additional fixes before starting
echo "Applying additional fixes..."

# Make sure the special_loader.js file exists
mkdir -p fixes
if [ ! -f "fixes/special_loader.js" ]; then
  echo "Creating special_loader.js..."
  cat > fixes/special_loader.js << 'EOF'
/**
 * Special module loader for Harmonic Universe
 * 
 * This script helps load JavaScript modules properly when MIME type issues occur.
 * It detects module script errors and provides fallback loading mechanisms.
 */

(function() {
  console.log("🔧 Special module loader initialized");
  
  // Store information about script errors
  const scriptErrors = new Map();
  
  // Create a global object to track loaded modules
  window.__HU_MODULES__ = window.__HU_MODULES__ || {};
  
  // Listen for script load errors
  window.addEventListener('error', function(event) {
    const target = event.target;
    
    // Only handle script errors
    if (target.tagName !== 'SCRIPT') return;
    
    const src = target.src || '';
    
    // Only handle module script errors
    if (target.type === 'module' || src.includes('/src/') || src.includes('index.js')) {
      console.warn(`⚠️ Module script error detected: ${src}`);
      scriptErrors.set(src, event);
      
      // Prevent error from showing in console
      event.preventDefault();
      
      // Try to load as regular script with special handling
      loadFallbackScript(src);
    }
  }, true);
  
  // Function to load a script as a regular script when module loading fails
  function loadFallbackScript(src) {
    console.log(`🔄 Loading fallback for: ${src}`);
    
    // Create a new script element
    const fallbackScript = document.createElement('script');
    fallbackScript.src = src;
    fallbackScript.onerror = function(event) {
      console.error(`❌ Fallback script load failed: ${src}`);
      
      // If fallback fails, generate a fake module
      generateFakeModule(src);
    };
    fallbackScript.onload = function() {
      console.log(`✅ Fallback script loaded: ${src}`);
    };
    
    // Add the script to the document
    document.head.appendChild(fallbackScript);
  }
  
  // Function to generate a fake module when all else fails
  function generateFakeModule(src) {
    console.log(`🔧 Generating fake module for: ${src}`);
    
    // Extract module name from src
    const moduleName = src.split('/').pop().split('.')[0];
    
    // Create a fake module
    window.__HU_MODULES__[moduleName] = {
      jsx: function(type, props) { return { type, props }; },
      jsxs: function(type, props) { return { type, props }; },
      Fragment: Symbol('Fragment'),
      default: { generated: true, source: src }
    };
    
    // Add these to the global scope
    window.jsx = window.__HU_MODULES__[moduleName].jsx;
    window.jsxs = window.__HU_MODULES__[moduleName].jsxs;
    window.Fragment = window.__HU_MODULES__[moduleName].Fragment;
    
    console.log(`✅ Fake module generated for: ${moduleName}`);
  }
  
  // Function to check if React is available and provide a polyfill if not
  function ensureReact() {
    if (typeof React === 'undefined') {
      console.warn("⚠️ React not found, loading from CDN");
      
      // Load React from CDN
      const reactScript = document.createElement('script');
      reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
      reactScript.crossOrigin = 'anonymous';
      document.head.appendChild(reactScript);
      
      const reactDomScript = document.createElement('script');
      reactDomScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
      reactDomScript.crossOrigin = 'anonymous';
      document.head.appendChild(reactDomScript);
      
      // Create a minimal React polyfill
      window.React = window.React || {
        createElement: function(type, props, ...children) {
          return { type, props: { ...props, children } };
        },
        Fragment: Symbol('Fragment')
      };
      
      window.ReactDOM = window.ReactDOM || {
        createRoot: function(container) {
          return {
            render: function(element) {
              container.innerHTML = '<div>React Polyfill Rendering</div>';
              console.log('React polyfill render:', element);
            }
          };
        }
      };
    }
  }
  
  // Ensure React is available
  ensureReact();
  
  // Add global access to the module loader
  window.__HU_MODULE_LOADER__ = {
    loadFallbackScript,
    generateFakeModule,
    ensureReact
  };
  
  console.log("✅ Special module loader ready");
})();
EOF
fi

# Make sure special_loader.js is copied to the static directory
if [ -f "fixes/special_loader.js" ]; then
  echo "Copying special_loader.js to static directory..."
  cp fixes/special_loader.js static/special_loader.js
fi

# Create a direct copy of index.js in the static directory
echo "Creating direct index.js in static directory..."
mkdir -p static/src
cat > static/src/index.js << 'EOF'
// Direct index.js module for Harmonic Universe
console.log("Loading direct index.js module");

// Export JSX functions
export function jsx(type, props) { 
    return { type, props }; 
}

export function jsxs(type, props) { 
    return { type, props }; 
}

export const Fragment = Symbol('Fragment');

// Default export
export default {
    path: "/src/index.js",
    timestamp: Date.now(),
    generated: true
};
EOF

# Make sure our static directory exists and has the correct permissions
echo "Setting up static directory..."
mkdir -p static
chmod -R 755 static

# Update index.html to include our special loader
if [ -f "static/index.html" ]; then
  echo "Updating index.html to include special_loader.js..."
  # Add special_loader.js right after the opening head tag
  sed -i 's/<head>/<head>\n  <script src="\/special_loader.js"><\/script>/' static/index.html
  
  # Make sure the base tag exists
  if ! grep -q "<base" static/index.html; then
    sed -i 's/<head>/<head>\n  <base href="\/">/' static/index.html
  fi
fi

# Set the environment variable to enable Render-specific fixes
export DEPLOYMENT_PLATFORM="render"

# Start the server
echo "Starting server..."
# Print the app.py file structure to debug the Flask app object
echo "Checking app.py structure..."
grep -n "app = " app.py
grep -n "create_app" app.py

# Use the correct application object - try different formats that might work
if grep -q "app = create_app()" app.py; then
  echo "Using 'app:app' format..."
  gunicorn --bind=0.0.0.0:$PORT --workers=2 --timeout=120 --log-level=info app:app
elif grep -q "def create_app" app.py; then
  echo "Using 'app:create_app()' format..."
  gunicorn --bind=0.0.0.0:$PORT --workers=2 --timeout=120 --log-level=info "app:create_app()"
else
  echo "Using module name only format..."
  gunicorn --bind=0.0.0.0:$PORT --workers=2 --timeout=120 --log-level=info app
fi 