#!/bin/bash
# setup-static.sh - Script to handle static file setup and fallbacks

set -e # Exit on error

# Check if ROOT_DIR is set, otherwise use current directory
ROOT_DIR=${ROOT_DIR:-$(pwd)}

echo "Setting up static files and fallbacks..."
echo "Root directory: $ROOT_DIR"

# Ensure static directory exists and has an index.html
if [ ! -f "$ROOT_DIR/backend/app/static/index.html" ]; then
  echo "No index.html found in backend/app/static directory, creating a placeholder"
  
  mkdir -p "$ROOT_DIR/backend/app/static"
  
  cat > "$ROOT_DIR/backend/app/static/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <!-- Include React and ReactDOM directly from CDN -->
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
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

# Create fallback scripts for React
echo "Creating fallback React scripts..."
mkdir -p "$ROOT_DIR/static"

cat > "$ROOT_DIR/static/react-setup.js" << 'EOF'
console.log('Loading React from CDN...');
// Already loaded in index.html
EOF

# Create a fallback index.js for direct loading
cat > "$ROOT_DIR/static/index.js" << 'EOF'
// Check if React and ReactDOM are already loaded
if (!window.React || !window.ReactDOM) {
  console.error('React or ReactDOM not found - loading from CDN');
  
  // Load React
  if (!window.React) {
    const reactScript = document.createElement('script');
    reactScript.src = 'https://unpkg.com/react@18/umd/react.production.min.js';
    reactScript.async = false;
    document.head.appendChild(reactScript);
  }
  
  // Load ReactDOM
  if (!window.ReactDOM) {
    const reactDOMScript = document.createElement('script');
    reactDOMScript.src = 'https://unpkg.com/react-dom@18/umd/react-dom.production.min.js';
    reactDOMScript.async = false;
    document.head.appendChild(reactDOMScript);
  }
}

// Simple App component to test rendering
console.log('Index.js loaded properly');
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM loaded, attempting to mount app');
  if (window.React && window.ReactDOM) {
    console.log('React and ReactDOM available');
    
    const App = () => {
      const [status, setStatus] = React.useState('Loading...');
      
      React.useEffect(() => {
        fetch('/api/health')
          .then(res => res.json())
          .then(data => setStatus(JSON.stringify(data)))
          .catch(err => setStatus('Error: ' + err.message));
      }, []);
      
      return React.createElement('div', null, [
        React.createElement('h1', {key: 'title'}, 'Harmonic Universe'),
        React.createElement('p', {key: 'status'}, 'Status: ' + status)
      ]);
    };
    
    const root = document.getElementById('root');
    if (root) {
      const reactRoot = ReactDOM.createRoot(root);
      reactRoot.render(React.createElement(App));
    }
  }
});
EOF

# Copy the fallback scripts to backend/static as well
cp "$ROOT_DIR/static/react-setup.js" "$ROOT_DIR/backend/app/static/" || echo "Warning: Could not copy react-setup.js to backend/app/static/"
cp "$ROOT_DIR/static/index.js" "$ROOT_DIR/backend/app/static/" || echo "Warning: Could not copy index.js to backend/app/static/"

# Check if there's an index.html in the secondary static folder, copy if not
if [ ! -f "$ROOT_DIR/static/index.html" ] && [ -f "$ROOT_DIR/backend/app/static/index.html" ]; then
  mkdir -p "$ROOT_DIR/static"
  cp -r "$ROOT_DIR/backend/app/static/"* "$ROOT_DIR/static/"
  echo "Copied index.html to static/ directory (secondary location)"
fi

# Copy static files to expected Render location for redundancy
mkdir -p /opt/render/project/src/static || echo "Could not create directory (normal for local build)"
cp -r "$ROOT_DIR/backend/app/static/"* /opt/render/project/src/static/ || echo "Warning: Could not copy to Render path"

echo "Static files setup completed successfully" 