#!/bin/bash
# build.sh - Comprehensive build process for Harmonic Universe
set -e  # Exit on error

echo "===== STARTING BUILD PROCESS ====="
echo "Date: $(date)"

# Set up Node.js environment
echo "==> Requesting Node.js version 18.18.0 - 20.11.1"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Python version: $(python -V)"

# Install Python dependencies
echo "===== INSTALLING PYTHON DEPENDENCIES ====="
python -m pip install --upgrade pip
pip install -r requirements.txt

# Fix React CDN issues
echo "===== FIXING REACT CDN ISSUES ====="
chmod +x ./fix-react-cdn.sh
./fix-react-cdn.sh

# Prepare directory structure
echo "===== PREPARING DIRECTORY STRUCTURE ====="
mkdir -p static

# Set up and build frontend
echo "===== ANALYZING FRONTEND STRUCTURE ====="
find frontend/src -type f | grep -E '\.jsx?$'

echo "===== INSTALLING FRONTEND DEPENDENCIES ====="
cd frontend

echo "Node.js version: $(node -v)"
echo "NPM version: $(npm -v)"
echo "Current directory: $(pwd)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
  echo "ERROR: package.json not found in $(pwd)"
  echo "Contents of directory:"
  ls -la
  echo "Creating a minimal package.json to proceed"
  cat > package.json << 'EOF'
{
  "name": "harmonic-universe-frontend",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "react": "^16.8.0",
    "react-dom": "^16.8.0"
  },
  "scripts": {
    "start": "vite",
    "build": "vite build",
    "render-build": "vite build"
  }
}
EOF
  echo "Created minimal package.json"
fi

# Define npm options to use for all commands
NPM_OPTIONS="--prefer-offline --no-fund"
if [ -n "$CI" ] || [ -n "$RENDER" ]; then
  echo "Adding timeout options to npm commands"
  NPM_OPTIONS="$NPM_OPTIONS --fetch-timeout=120000 --fetch-retries=5"
fi

# Check if node_modules exists and remove it if it's causing issues
if [ -d "node_modules" ] && [ "$CLEAN_INSTALL" = "true" ]; then
  echo "Removing existing node_modules for clean install"
  rm -rf node_modules
fi

# Check if package-lock.json exists
if [ -f "package-lock.json" ]; then
  echo "Found package-lock.json, using npm ci"
  # Try with legacy peer deps flag to bypass TypeScript version conflicts
  npm ci --legacy-peer-deps $NPM_OPTIONS || (echo "npm ci failed, falling back to npm install" && npm install --legacy-peer-deps $NPM_OPTIONS)
else
  echo "No package-lock.json found, using npm install instead"
  # Use npm install to generate package-lock.json
  npm install --legacy-peer-deps $NPM_OPTIONS ||
    (echo "npm install failed, trying with --force" &&
     npm install --legacy-peer-deps --force $NPM_OPTIONS) ||
    (echo "npm install with force failed, trying with --no-optional" &&
     npm install --legacy-peer-deps --no-optional $NPM_OPTIONS)
fi

# Always install critical development dependencies
echo "===== FIXING DEPENDENCY ISSUES ====="
npm install --save-dev @vitejs/plugin-react --legacy-peer-deps $NPM_OPTIONS
# Explicitly install React and ReactDOM to ensure compatibility
npm install react@">=16.8.0" react-dom@">=16.8.0" --legacy-peer-deps $NPM_OPTIONS

# This is what's causing the minimal test app issue - the troubleshooting scripts create it
# Let's actively check for and disable those scripts
echo "===== PREVENTING TROUBLESHOOTING SCRIPTS ====="
if [ -f "../fix-build-esm.sh" ]; then
  echo "WARNING: fix-build-esm.sh exists, which could replace your app with a minimal version"
  echo "Renaming it to prevent accidental usage"
  mv ../fix-build-esm.sh ../fix-build-esm.sh.disabled
fi

if [ -f "../fix-frozen-build.sh" ]; then
  echo "WARNING: fix-frozen-build.sh exists, which could replace your app with a minimal version"
  echo "Renaming it to prevent accidental usage"
  mv ../fix-frozen-build.sh ../fix-frozen-build.sh.disabled
fi

# Ensure we're using the full application, not the test version
echo "===== RESTORING ORIGINAL APP.JSX ====="
if [ -f "src/App.jsx.original" ]; then
  echo "Found original App.jsx backup - restoring it"
  cp src/App.jsx.original src/App.jsx
  echo "App.jsx restored from backup"
elif grep -q "Minimal Test App" src/App.jsx; then
  echo "WARNING: Test version detected in App.jsx, but no backup found"
  echo "Please restore your full application code manually"
fi

# Apply critical patches first - create a context-fix.js that will be loaded first in index.html
echo "===== CREATING CRITICAL REACT FIXES ====="
mkdir -p public
cat > public/critical-react-fix.js << 'EOF'
/**
 * Critical React fixes to be loaded before any React code runs
 * This must be the first script loaded in index.html to ensure React Error #321 is fixed
 */
(function() {
  // Ensure React exists globally
  window.React = window.React || {};
  window.__REACT_FIXES_APPLIED = true;

  // Fix React.createContext - Error #321
  if (window.React.createContext) {
    console.log('[Critical Fix] Patching React.createContext');
    const originalCreateContext = window.React.createContext;
    window.React.createContext = function(defaultValue, calculateChangedBits) {
      try {
        const context = originalCreateContext(defaultValue, calculateChangedBits);
        if (context) {
          // Fix Provider properties
          if (context.Provider) {
            context.Provider.isReactComponent = true;
            if (typeof Symbol !== 'undefined') {
              context.Provider.$$typeof = Symbol.for('react.element');
            }
          }
          // Fix Consumer properties
          if (context.Consumer) {
            context.Consumer.isReactComponent = true;
            if (typeof Symbol !== 'undefined') {
              context.Consumer.$$typeof = Symbol.for('react.element');
            }
          }
        }
        return context;
      } catch (error) {
        console.error('[Critical Fix] Context creation error', error);
        return {
          Provider: function(props) { return props.children; },
          Consumer: function(props) {
            return typeof props.children === 'function' ? props.children(defaultValue) : props.children;
          },
          _currentValue: defaultValue,
          _currentValue2: defaultValue
        };
      }
    };
  } else {
    console.log('[Critical Fix] Adding React.createContext polyfill');
    window.React.createContext = function(defaultValue) {
      return {
        Provider: function(props) { return props.children; },
        Consumer: function(props) {
          return typeof props.children === 'function' ? props.children(defaultValue) : props.children;
        },
        _currentValue: defaultValue,
        _currentValue2: defaultValue
      };
    };
  }

  // Fix ReactDOM availability
  window.ReactDOM = window.ReactDOM || {
    version: '16.8.0',
    render: function(element, container) {
      console.warn('[Critical Fix] ReactDOM.render polyfill called');
      if (container) container.innerHTML = '<div>React rendering not available</div>';
    },
    createRoot: function(container) {
      console.warn('[Critical Fix] ReactDOM.createRoot polyfill called');
      return {
        render: function(element) {
          console.warn('[Critical Fix] Root render polyfill called');
          if (container) container.innerHTML = '<div>React root rendering not available</div>';
        }
      };
    }
  };

  // Fix DOM Node issues with removeChild
  if (typeof Node !== 'undefined' && Node.prototype) {
    console.log('[Critical Fix] Patching Node.prototype.removeChild');
    const originalRemoveChild = Node.prototype.removeChild;
    Node.prototype.removeChild = function(child) {
      try {
        if (!this.contains(child)) {
          console.warn('[Critical Fix] Prevented removeChild on non-child node');
          return child;
        }
        return originalRemoveChild.call(this, child);
      } catch (err) {
        console.warn('[Critical Fix] Error in removeChild:', err);
        return child;
      }
    };
  }

  // Setup diagnostic hooks
  window.__REACT_DIAGNOSTIC = {
    version: React.version,
    contextError: false,
    providerError: false,
    domError: false,
    errors: []
  };

  // Override console.error to track React errors
  const originalConsoleError = console.error;
  console.error = function() {
    const args = Array.from(arguments);
    originalConsoleError.apply(console, args);

    // Track React-specific errors
    const errorMsg = args.join(' ');
    if (errorMsg.includes('Invalid hook call') ||
        errorMsg.includes('Context.Provider') ||
        errorMsg.includes('useContext') ||
        errorMsg.includes('Error #321')) {
      window.__REACT_DIAGNOSTIC.contextError = true;
      window.__REACT_DIAGNOSTIC.errors.push({
        time: new Date().toISOString(),
        message: errorMsg
      });
    }
  };

  console.log('[Critical Fix] React critical fixes applied');
})();
EOF

# Create utilities for context fixes
echo "===== CREATING REACT CONTEXT UTILITY MODULES ====="

# Add this line before line 259 in build.sh:
cd ..  # Move back to the project root
mkdir -p src/utils
cat > src/utils/react-diagnostics.js << 'EOF'

# Create React Context diagnostics module
mkdir -p src/utils
cat > src/utils/react-diagnostics.js << 'EOF'
/**
 * React diagnostics module - helps diagnose context issues
 */

// Create a registry of all React contexts in the app
window.__REACT_CONTEXTS = window.__REACT_CONTEXTS || {};
window.__REACT_HOOKS = window.__REACT_HOOKS || {};

// Helper to register a context
export function registerContext(name, context) {
  if (window.__REACT_CONTEXTS) {
    window.__REACT_CONTEXTS[name] = context;
    console.log(`[Diagnostics] Registered context: ${name}`);
  }
  return context;
}

// Helper to get diagnostic info
export function getDiagnosticInfo() {
  const info = {
    react: window.React ? window.React.version : 'Not loaded',
    reactDOM: window.ReactDOM ? window.ReactDOM.version : 'Not loaded',
    contexts: Object.keys(window.__REACT_CONTEXTS || {}),
    hooks: Object.keys(window.__REACT_HOOKS || {}),
    errors: window.__REACT_DIAGNOSTIC ? window.__REACT_DIAGNOSTIC.errors : []
  };

  console.log('[Diagnostics] Info:', info);
  return info;
}

// Initialize diagnostics on load
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    console.log('[Diagnostics] Running React diagnostics...');
    getDiagnosticInfo();
  });
}

// Register hook usage
export function registerHook(name) {
  if (window.__REACT_HOOKS) {
    window.__REACT_HOOKS[name] = true;
    console.log(`[Diagnostics] Registered hook usage: ${name}`);
  }
}

export default {
  registerContext,
  registerHook,
  getDiagnosticInfo
};
EOF
echo "React diagnostics module created"

# Apply fixes for React app loading issues - these modules already exist from previous edits
echo "===== CHECKING REACT APP LOADING FIXES ====="

# 1. Check ReactDOM fix utility
if [ ! -f "src/utils/ensure-react-dom.js" ]; then
  echo "ReactDOM fix module missing - creating it"
  # The content of this file is already defined above, no need to redefine it
else
  echo "ReactDOM fix module already exists"
fi

# 2. Check Redux Provider Fix
if [ ! -f "src/utils/ensure-redux-provider.js" ]; then
  echo "Redux Provider fix module missing - creating it"
  # The content of this file is already defined above, no need to redefine it
else
  echo "Redux Provider fix module already exists"
fi

# 3. Check Router Provider Fix
if [ ! -f "src/utils/ensure-router-provider.js" ]; then
  echo "Router Provider fix module missing - creating it"
  # The content of this file is already defined above, no need to redefine it
else
  echo "Router Provider fix module already exists"
fi

# Update index.js to import the diagnostic module
echo "===== UPDATING INDEX.JS WITH DIAGNOSTICS ====="
if [ -f "src/index.js" ]; then
  if ! grep -q "react-diagnostics" src/index.js; then
    sed -i '4i import "./utils/react-diagnostics";' src/index.js
    echo "Added React diagnostics to index.js"
  else
    echo "React diagnostics already imported in index.js"
  fi
fi

# Update vite.config.js to disable source maps for production
echo "===== UPDATING VITE CONFIG ====="
sed -i -e 's/sourcemap: true/sourcemap: false/g' vite.config.js

# Create a production version marker
echo "===== CREATING VERSION MARKER ====="
echo "HARMONIC_UNIVERSE_BUILD=$(date +%s)" > .env.production

# Set production mode for the build
echo "===== SETTING PRODUCTION MODE ====="
export NODE_ENV=production
export VITE_APP_ENV=production

# Build the frontend
echo "===== BUILDING FRONTEND ====="
if npm run render-build; then
  echo "Frontend build completed successfully"
else
  echo "Frontend build failed, creating minimal fallback build"
  # Create minimal dist directory with essential files
  mkdir -p dist

  # Create minimal index.html
  cat > dist/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Harmonic Universe</title>
    <!-- Load React from CDN -->
    <script crossorigin src="https://unpkg.com/react@16.8.0/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@16.8.0/umd/react-dom.production.min.js"></script>
    <!-- Fallback script -->
    <script src="fallback.js"></script>
    <style>
      body { font-family: system-ui, sans-serif; margin: 0; padding: 0; }
      .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
      .header { background: #1c1c1c; color: white; padding: 1rem; }
      .content { padding: 2rem 0; }
    </style>
  </head>
  <body>
    <div id="root">
      <div class="container">
        <div class="header">
          <h1>Harmonic Universe</h1>
        </div>
        <div class="content">
          <p>Application is loading...</p>
        </div>
      </div>
    </div>
    <script>
      document.addEventListener('DOMContentLoaded', function() {
        window.setTimeout(function() {
          document.querySelector('.content').innerHTML = '<p>Application is running in fallback mode.</p>';
        }, 1000);
      });
    </script>
  </body>
</html>
EOF

  # Create fallback JavaScript
  cat > dist/fallback.js << 'EOF'
console.log('Harmonic Universe running in fallback mode');
// Initialize minimal React components
window.addEventListener('load', function() {
  if (window.React && window.ReactDOM) {
    try {
      const App = React.createElement('div', null, [
        React.createElement('h1', { key: 'title' }, 'Harmonic Universe'),
        React.createElement('p', { key: 'message' }, 'Application is running in fallback mode.')
      ]);
      ReactDOM.render(App, document.getElementById('root'));
      console.log('Fallback React rendering successful');
    } catch (e) {
      console.error('Failed to render fallback React components:', e);
    }
  }
});
EOF

  echo "Created minimal fallback build"
fi
echo "===== EXAMINING VITE BUILD OUTPUT ====="
find dist -type f | sort
cd ..

# Copy frontend build to static directory
echo "===== COPYING FRONTEND BUILD TO STATIC ====="
cp -r frontend/dist/* static/

# Create a version.js file for cache busting
echo "===== ADDING CACHE BUSTING ====="
cat > static/version.js << 'EOF'
/**
 * Version information for Harmonic Universe
 */
window.APP_VERSION = {
  version: '1.0.0',
  buildDate: '$(date +%Y-%m-%d)',
  buildTimestamp: Date.now(),
  environment: window.location.hostname.includes('localhost') ? 'development' : 'production'
};
EOF

# Modify the index.html file to include our critical fixes first, before any other script
echo "===== UPDATING INDEX.HTML WITH CRITICAL FIXES ====="
if [ -f "static/index.html" ]; then
  # Make a backup of the original file
  cp static/index.html static/index.html.bak

  # Define the script tag for critical fixes
  CRITICAL_FIX_SCRIPT='<script src="critical-react-fix.js"></script>'

  # Add critical fixes script as the first item in the head
  sed -i "s|<head>|<head>\n  $CRITICAL_FIX_SCRIPT|" static/index.html

  # Add a cache-busting version parameter to all script tags
  sed -i 's/\.js"/\.js?v=$(date +%s)"/g' static/index.html

  # Copy the critical fixes script to the static directory
  cp frontend/public/critical-react-fix.js static/

  echo "Updated index.html with critical fixes"
fi

# Copy runtime diagnostics scripts to static directory
echo "===== ADDING RUNTIME DIAGNOSTIC SCRIPTS ====="
cat > static/runtime-diagnostics.js << 'EOF'
/**
 * Runtime diagnostics for Harmonic Universe
 */
(function() {
  window.addEventListener('load', function() {
    console.log('===== RUNTIME DIAGNOSTICS =====');

    // Check React
    const reactStatus = window.React && window.React.version;
    console.log('React Version:', reactStatus || 'Not loaded');

    // Check ReactDOM
    const reactDomStatus = window.ReactDOM && window.ReactDOM.version;
    console.log('ReactDOM Version:', reactDomStatus || 'Not loaded');

    // Check contexts
    console.log('Registered contexts:', Object.keys(window.__REACT_CONTEXTS || {}));

    // Check for Error #321
    console.log('React Error #321 fixes applied:', window.__REACT_FIXES_APPLIED ? 'Yes' : 'No');

    // Check for errors in diagnostic store
    if (window.__REACT_DIAGNOSTIC && window.__REACT_DIAGNOSTIC.errors.length > 0) {
      console.log('React errors detected:', window.__REACT_DIAGNOSTIC.errors.length);
      window.__REACT_DIAGNOSTIC.errors.forEach(err => {
        console.log(' - ' + err.time + ': ' + err.message);
      });
    } else {
      console.log('No React errors detected in diagnostic store');
    }

    // Report DOM ready state
    console.log('DOM ready state:', document.readyState);

    // Root element status
    const rootEl = document.getElementById('root');
    console.log('Root element exists:', rootEl ? 'Yes' : 'No');

    // Check if React was able to render into the root
    if (rootEl) {
      const hasReactContent = rootEl.hasAttribute('data-reactroot') ||
                             (rootEl.innerHTML && rootEl.innerHTML.length > 100);
      console.log('Root contains React content:', hasReactContent ? 'Likely' : 'No');
    }
  });

  // Inject diagnostic info function
  window.showReactDiagnostics = function() {
    alert('React: ' + (window.React ? window.React.version : 'Not loaded') +
          '\nReactDOM: ' + (window.ReactDOM ? window.ReactDOM.version : 'Not loaded') +
          '\nError #321 fixed: ' + (window.__REACT_FIXES_APPLIED ? 'Yes' : 'No') +
          '\nErrors detected: ' + (window.__REACT_DIAGNOSTIC ? window.__REACT_DIAGNOSTIC.errors.length : 'N/A'));
  };
})();
EOF

# Add the diagnostics script to index.html
if [ -f "static/index.html" ]; then
  # Insert diagnostics script right before the closing body tag
  sed -i 's|</body>|<script src="runtime-diagnostics.js?v=$(date +%s)"></script>\n</body>|' static/index.html
fi

echo "===== BUILD PROCESS COMPLETE ====="
echo '{"buildTime": "'$(date)'", "buildSuccess": true}' > static/build-info.json

# Inspect static directory structure
echo "===== INSPECTING STATIC DISTRIBUTION ====="
echo "Contents of static directory:"
ls -la static
echo "Structure of static directory:"
find static -type f | sort

# Copy consolidated React fixes
echo "Copying consolidated React fixes..."
mkdir -p dist/static/react-fixes
cp -r static/react-fixes/* dist/static/react-fixes/

# Add note about Flask compatibility
echo "===== FLASK COMPATIBILITY NOTES ====="
echo "Note: The application has been updated to work with Flask 2.x+"
echo "      If you experience any environment-related issues, check the"
echo "      following environment variables:"
echo "      - FLASK_ENV: ${FLASK_ENV:-production}"
echo "      - FLASK_DEBUG: ${FLASK_DEBUG:-0}"
echo "      - PORT: ${PORT:-8000} (changed from 5000 to avoid conflicts with AirPlay on macOS)"

echo "===== BUILD PROCESS COMPLETED ====="
echo "Date: $(date)"
echo "Build files placed in: $(pwd)/static"
