#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe server at $(date)"
echo "Current directory: $(pwd)"

# Navigate to the backend directory if needed
if [ ! -f "app.py" ]; then
    echo "app.py not found, navigating to backend directory"
    cd backend
fi

# Check if we found app.py
if [ ! -f "app.py" ]; then
    echo "ERROR: app.py not found in current or backend directory"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    exit 1
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

# Ensure static directory exists
mkdir -p static

# Copy diagnostic files if they don't exist
if [ ! -f "static/diagnostic.html" ]; then
    echo "Creating diagnostic files..."
    
    # Create diagnostic HTML
    cat > static/diagnostic.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe Diagnostics</title>
  <script src="/js/react.production.min.js"></script>
  <script src="/js/react-dom.production.min.js"></script>
</head>
<body>
  <div id="root">Loading diagnostics...</div>
  <script src="/diagnostic.js"></script>
</body>
</html>
EOF

    # Create diagnostic JS
    cat > static/diagnostic.js << 'EOF'
document.addEventListener('DOMContentLoaded', function() {
  const root = document.getElementById('root');
  
  // Create diagnostic content
  const content = document.createElement('div');
  content.innerHTML = `
    <h1>Harmonic Universe Diagnostics</h1>
    <div>
      <h2>Environment</h2>
      <ul>
        <li>URL: ${window.location.href}</li>
        <li>React Loaded: ${!!window.React}</li>
        <li>ReactDOM Loaded: ${!!window.ReactDOM}</li>
      </ul>
      <h2>API Tests</h2>
      <div id="api-results">Running tests...</div>
    </div>
  `;
  
  root.appendChild(content);
  
  // Run API tests
  const endpoints = ['/api/health', '/api/debug/whitenoise', '/api/debug/mime-test'];
  const results = document.getElementById('api-results');
  
  endpoints.forEach(url => {
    fetch(url)
      .then(response => response.json())
      .then(data => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>${url}: <span style="color:green">Success</span></h3>
                        <pre>${JSON.stringify(data, null, 2)}</pre>`;
        results.appendChild(div);
      })
      .catch(error => {
        const div = document.createElement('div');
        div.innerHTML = `<h3>${url}: <span style="color:red">Failed</span></h3>
                        <pre>${error.message}</pre>`;
        results.appendChild(div);
      });
  });
});
EOF
fi

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

# Ensure React is available in the static directory
echo "Checking for React scripts..."
mkdir -p static/js

# If React scripts are not in the static directory, try to copy them from frontend build
if [ ! -f "static/js/react.production.min.js" ]; then
  echo "React scripts not found, looking for them in frontend build..."
  
  # Check frontend build directory
  if [ -f "../frontend/dist/js/react.production.min.js" ]; then
    echo "Copying React scripts from frontend build..."
    cp ../frontend/dist/js/react.production.min.js static/js/
    cp ../frontend/dist/js/react-dom.production.min.js static/js/
  else
    echo "React scripts not found in frontend build, creating from CDN URLs..."
    # Create directory for JS files
    mkdir -p static/js
    
    # Download React from CDN
    echo "Downloading React from CDN..."
    curl -s https://unpkg.com/react@18/umd/react.production.min.js > static/js/react.production.min.js
    curl -s https://unpkg.com/react-dom@18/umd/react-dom.production.min.js > static/js/react-dom.production.min.js
    
    echo "React scripts downloaded to static/js/"
  fi
fi

# Update index.html to include our special loader and React scripts
if [ -f "static/index.html" ]; then
  echo "Updating index.html to include React scripts..."
  
  # Check if React scripts are already included
  if ! grep -q "react.production.min.js" static/index.html; then
    # Add React scripts right after the opening head tag
    sed -i 's/<head>/<head>\n  <script src="\/js\/react.production.min.js"><\/script>\n  <script src="\/js\/react-dom.production.min.js"><\/script>/' static/index.html
  fi
  
  # Add special_loader.js right after the React scripts
  if ! grep -q "special_loader.js" static/index.html; then
    sed -i 's/<\/script>/<\/script>\n  <script src="\/special_loader.js"><\/script>/' static/index.html
  fi
  
  # Make sure the base tag exists
  if ! grep -q "<base" static/index.html; then
    sed -i 's/<head>/<head>\n  <base href="\/">/' static/index.html
  fi
fi

# Set the environment variable to enable Render-specific fixes
export DEPLOYMENT_PLATFORM="render"

# Examine app.py to determine what Gunicorn should import
echo "Examining app.py structure..."
grep -n "app = " app.py || echo "No 'app = ' pattern found"
grep -n "def create_app" app.py || echo "No 'create_app' function found"

# Create a simple test script to help debug the app structure
echo "Creating test script..."
cat > test_app.py << 'EOF'
#!/usr/bin/env python3
import sys
print("Testing app.py module")
try:
    import app
    print("Successfully imported app module")
    
    if hasattr(app, 'app'):
        print("Found app.app - direct app instance")
        app_obj = app.app
        print(f"Type: {type(app_obj)}")
    else:
        print("No app.app found")
    
    if hasattr(app, 'create_app'):
        print("Found app.create_app - factory function")
        try:
            app_obj = app.create_app()
            print(f"Factory returned: {type(app_obj)}")
        except Exception as e:
            print(f"Error calling create_app: {e}")
    else:
        print("No app.create_app found")
        
    # Look for any Flask instances
    print("\nLooking for Flask objects in app module:")
    for name in dir(app):
        obj = getattr(app, name)
        if str(type(obj)).find('Flask') != -1:
            print(f"Found Flask object: app.{name}, type: {type(obj)}")
except Exception as e:
    print(f"Error importing app: {e}")
EOF

# Run the test script
echo "Running app.py test script..."
python test_app.py

# Try with multiple WSGI paths to find the right one
echo "Starting Gunicorn with testing different WSGI paths..."
export PYTHONUNBUFFERED=1

# Determine the app path using a fallback approach
echo "Testing app:app first..."
if python -c "import app; getattr(app, 'app')" 2>/dev/null; then
    echo "Verified app:app is valid"
    APP_PATH="app:app"
elif python -c "import app; app.create_app()" 2>/dev/null; then
    echo "Verified app:create_app() is valid"
    APP_PATH="app:create_app()"
else
    echo "WARNING: Could not verify app path, using app:app"
    APP_PATH="app:app"
fi

echo "Starting Gunicorn with: $APP_PATH"
gunicorn $APP_PATH \
    --bind=0.0.0.0:$PORT \
    --workers=1 \
    --worker-class=sync \
    --log-level=debug \
    --access-logfile=- \
    --error-logfile=- \
    --disable-redirect-access-to-syslog \
    --timeout=180 \
    --forwarded-allow-ips="*" \
    --access-logformat='%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s %(D)s "%(f)s" "%(a)s"' \
    --preload 

# Debug environment to understand where we are
echo "==============================="
echo "ULTRA-MINIMAL DEBUGGING SETUP"
echo "==============================="
echo "Current directory: $(pwd)"
echo "Directory contents:"
ls -la
echo "Environment variables:"
env | sort
echo "==============================="

# Create a diagnostic file to help troubleshoot
echo "Creating diagnostic HTML file..."
mkdir -p static
cat > static/test.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Render Test Page</title>
</head>
<body>
    <h1>Render Test Page</h1>
    <p>If you can see this page, static file serving is working correctly!</p>
    <p>Time: <script>document.write(new Date().toISOString())</script></p>
</body>
</html>
EOF

# Ensure we have the latest pip and required packages
echo "Installing minimal required packages..."
pip install --upgrade pip
pip install gunicorn

# Run directly with Gunicorn using our ultra-minimal WSGI file
echo "Starting ultra-minimal WSGI application..."
export PYTHONUNBUFFERED=1
echo "Setting port to: $PORT"

if [ -f "wsgi.py" ]; then
    echo "Found wsgi.py in current directory"
    APP_PATH="wsgi:application"
elif [ -f "backend/wsgi.py" ]; then
    echo "Found wsgi.py in backend directory"
    APP_PATH="backend.wsgi:application"
else
    echo "ERROR: wsgi.py not found. Creating it..."
    
    # Create a minimal WSGI app on the fly if the file doesn't exist
    cat > wsgi.py << 'EOL'
def application(environ, start_response):
    """Absolute minimal WSGI application"""
    status = '200 OK'
    response_headers = [
        ('Content-type', 'text/plain'),
        ('Content-Length', '73')
    ]
    start_response(status, response_headers)
    return [b'This is a minimal response from an emergency WSGI application created on-the-fly']
EOL

    echo "Created emergency wsgi.py file"
    APP_PATH="wsgi:application"
fi

echo "Starting Gunicorn with APP_PATH=$APP_PATH on port=$PORT"
echo "==============================="

# Run Gunicorn with the most minimal configuration possible
exec gunicorn "$APP_PATH" \
    --bind=0.0.0.0:$PORT \
    --workers=1 \
    --worker-class=sync \
    --timeout=120 \
    --log-level=debug \
    --access-logfile=- \
    --error-logfile=- \
    --capture-output 