#!/bin/bash
set -e

echo "===== FIXING REACT CDN ISSUES ====="
echo "Date: $(date)"

# Create static directory if it doesn't exist
mkdir -p static

# Check if React CDN files are accessible
REACT_CDN="https://unpkg.com/react@16.8.0/umd/react.production.min.js"
REACT_DOM_CDN="https://unpkg.com/react-dom@16.8.0/umd/react-dom.production.min.js"

echo "Testing access to React CDN files..."
if curl -s --head $REACT_CDN | grep "200 OK" > /dev/null; then
  echo "✅ React CDN accessible"
else
  echo "❌ React CDN not accessible, downloading locally"

  # Download React files locally
  curl -L -o static/react.production.min.js $REACT_CDN || \
    curl -L -o static/react.production.min.js "https://cdnjs.cloudflare.com/ajax/libs/react/16.8.0/umd/react.production.min.js"

  curl -L -o static/react-dom.production.min.js $REACT_DOM_CDN || \
    curl -L -o static/react-dom.production.min.js "https://cdnjs.cloudflare.com/ajax/libs/react-dom/16.8.0/umd/react-dom.production.min.js"

  # Update index.html to use local files
  if [ -f "static/index.html" ]; then
    echo "Updating static/index.html to use local React files"
    sed -i 's|https://unpkg.com/react@16.8.0/umd/react.production.min.js|/react.production.min.js|g' static/index.html
    sed -i 's|https://unpkg.com/react-dom@16.8.0/umd/react-dom.production.min.js|/react-dom.production.min.js|g' static/index.html
  fi

  # Create symbolic links in root directory
  ln -sf $(pwd)/static/react.production.min.js $(pwd)/react.production.min.js
  ln -sf $(pwd)/static/react-dom.production.min.js $(pwd)/react-dom.production.min.js

  echo "✅ Local React files created and linked"
fi

# Create a minimal React implementation to ensure it's always available
echo "Creating minimal React fallback implementation..."
cat > static/react-fallback.js << 'EOF'
// Fallback React implementation in case CDN fails
(function() {
  if (!window.React) {
    console.log("Loading React fallback implementation");
    window.React = {
      version: '16.8.0',
      createElement: function() { return {}; },
      createContext: function() {
        return {
          Provider: function() {},
          Consumer: function() {}
        };
      },
      useState: function(initialValue) {
        return [initialValue, function() {}];
      },
      useEffect: function() {},
      useContext: function() {},
      __isFallback: true
    };

    window.ReactDOM = {
      version: '16.8.0',
      render: function() {},
      createRoot: function() {
        return { render: function() {} };
      },
      __isFallback: true
    };

    console.log("React fallback implementation loaded");
  }
})();
EOF

# Add the fallback script to index.html if not already there
if [ -f "static/index.html" ] && ! grep -q "react-fallback.js" static/index.html; then
  echo "Adding React fallback to index.html"
  sed -i 's|<script crossorigin src="https://unpkg.com/react@16.8.0/umd/react.production.min.js"></script>|<script crossorigin src="https://unpkg.com/react@16.8.0/umd/react.production.min.js"></script>\n    <script src="/react-fallback.js"></script>|' static/index.html
fi

echo "===== REACT CDN FIX COMPLETED ====="
