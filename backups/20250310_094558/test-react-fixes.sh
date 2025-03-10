#!/bin/bash
# test-react-fixes.sh - Test React error fixes locally
set -e  # Exit on error

echo "===== TESTING REACT ERROR FIXES ====="
echo "Date: $(date)"
echo "Testing: React + Context Provider Fixes"

# Check if files exist
echo "Verifying fix files..."
files=(
  "static/react-error-handler.js"
  "static/react-force-expose.js"
  "static/react-polyfill.js"
  "static/react-context-provider.js"
  "static/hook-fix.js"
  "static/react-version-checker.js"
  "static/react-diagnostics.js"
  "static/index.html"
  "static/manifest.json"
  "static/favicon.ico"
)

essential_files=(
  "static/react-error-handler.js"
  "static/react-force-expose.js"
  "static/react-polyfill.js"
  "static/react-context-provider.js"
  "static/hook-fix.js"
  "static/react-version-checker.js"
  "static/react-diagnostics.js"
  "static/index.html"
)

missing_essential=false
missing_files=false
for file in "${files[@]}"; do
  if [ ! -f "$file" ]; then
    if [[ " ${essential_files[@]} " =~ " ${file} " ]]; then
      echo "❌ ERROR: Essential file $file not found!"
      missing_essential=true
    else
      echo "⚠️ Warning: $file not found. This may cause issues."
      missing_files=true
    fi

    # Create placeholders for missing non-essential files
    if [[ "$file" == "static/manifest.json" && ! -f "static/manifest.json" ]]; then
      echo "Creating placeholder manifest.json..."
      echo '{
  "short_name": "Harmonic Universe",
  "name": "Harmonic Universe",
  "icons": [
    {
      "src": "favicon.ico",
      "sizes": "64x64 32x32 24x24 16x16",
      "type": "image/x-icon"
    }
  ],
  "start_url": ".",
  "display": "standalone",
  "theme_color": "#000000",
  "background_color": "#ffffff"
}' > static/manifest.json
      echo "✅ Created placeholder manifest.json"
    elif [[ "$file" == "static/favicon.ico" && ! -f "static/favicon.ico" ]]; then
      echo "Creating placeholder favicon.ico..."
      touch static/favicon.ico
      echo "✅ Created placeholder favicon.ico"
    elif [[ "$file" == "static/react-diagnostics.js" && ! -f "static/react-diagnostics.js" ]]; then
      echo "Creating basic react-diagnostics.js..."
      cat > static/react-diagnostics.js << 'EOL'
/**
 * Basic React Diagnostics Tool
 */
(function() {
  console.log('[React Diagnostics] Basic version initialized');

  function createButton() {
    const btn = document.createElement('button');
    btn.textContent = 'React Info';
    btn.style.position = 'fixed';
    btn.style.top = '10px';
    btn.style.right = '10px';
    btn.style.zIndex = '9999';
    btn.style.backgroundColor = '#FF5722';
    btn.style.color = 'white';
    btn.style.border = 'none';
    btn.style.borderRadius = '4px';
    btn.style.padding = '5px 10px';

    btn.onclick = function() {
      alert(
        'React: ' + (window.React ? window.React.version : 'Not loaded') + '\n' +
        'ReactDOM: ' + (window.ReactDOM ? window.ReactDOM.version : 'Not loaded') + '\n' +
        'Root element: ' + (document.getElementById('root') ? 'Found' : 'Not found') + '\n' +
        'Redux context: ' + (window.ReduxContext ? 'Available' : 'Missing') + '\n' +
        'Router context: ' + (window.RouterContext ? 'Available' : 'Missing')
      );
    };

    document.body.appendChild(btn);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createButton);
  } else {
    createButton();
  }
})();
EOL
      echo "✅ Created basic diagnostics script"
    fi
  else
    echo "✅ $file found"
  fi
done

if [ "$missing_essential" = true ]; then
  echo ""
  echo "ERROR: Essential files are missing. Testing cannot proceed."
  echo "Please create the missing files and try again."
  exit 1
fi

if [ "$missing_files" = true ]; then
  echo ""
  echo "WARNING: Some non-essential files are missing. Testing may not be accurate."
  echo "Placeholders have been created where possible."
  echo ""
fi

# Function to check if a port is available
check_port() {
  local port=$1
  if command -v nc &>/dev/null; then
    nc -z localhost $port &>/dev/null
    return $?
  elif command -v lsof &>/dev/null; then
    lsof -i :$port &>/dev/null
    return $?
  else
    # If neither nc nor lsof is available, we'll just try to use the port
    return 1
  fi
}

# Find an available port starting from the preferred port
find_available_port() {
  local preferred_port=$1
  local max_port=$(($preferred_port + 20))  # Try up to 20 ports after the preferred one

  local port=$preferred_port
  while [ $port -le $max_port ]; do
    if ! check_port $port; then
      echo $port
      return 0
    fi
    port=$(($port + 1))
  done

  echo "ERROR: Could not find an available port between $preferred_port and $max_port"
  return 1
}

# Variables for server management
SERVER_PID=""
SERVER_PORT=$(find_available_port 5000)
if [ $? -ne 0 ]; then
  echo "ERROR: No available ports found. Please free up a port and try again."
  exit 1
fi

# Create a simple test server for local testing
echo "Starting test server on port $SERVER_PORT..."
cd static || exit 1

# Start the server with error handling
(python -m http.server $SERVER_PORT 2>/tmp/server_error.log) &
SERVER_PID=$!

# Wait a moment to see if the server starts successfully
sleep 1

# Check if the server is actually running
if ! ps -p $SERVER_PID > /dev/null; then
  echo "ERROR: Failed to start the test server on port $SERVER_PORT"
  if [ -f /tmp/server_error.log ]; then
    echo "Server error log:"
    cat /tmp/server_error.log
  fi
  exit 1
fi

echo "Test server started with PID: $SERVER_PID"
echo "You can now open http://localhost:$SERVER_PORT in your browser to test the fixes"
echo "Press Ctrl+C when you're done testing"

function cleanup {
  echo "Stopping test server..."
  if [ -n "$SERVER_PID" ] && ps -p $SERVER_PID > /dev/null; then
    kill $SERVER_PID
    echo "Test server stopped"
  else
    echo "Test server is not running"
  fi

  # Clean up error log file
  rm -f /tmp/server_error.log

  echo ""
  echo "===== TESTING COMPLETED ====="
  echo "Date: $(date)"
  echo ""
  echo "If you encountered any issues, please check:"
  echo "1. The browser console (F12 > Console tab)"
  echo "2. The React Diagnostics panel (click 'Show Diagnostics' button)"
  echo "3. Make sure all essential files are present"
}

# Set up trap to clean up on exit
trap cleanup EXIT INT TERM

# Open the browser automatically if possible
if command -v open &>/dev/null; then
  echo "Opening browser..."
  open "http://localhost:$SERVER_PORT"
elif command -v xdg-open &>/dev/null; then
  echo "Opening browser..."
  xdg-open "http://localhost:$SERVER_PORT"
elif command -v start &>/dev/null; then
  echo "Opening browser..."
  start "http://localhost:$SERVER_PORT"
else
  echo "Please open http://localhost:$SERVER_PORT in your browser manually"
fi

# Output helpful tips
echo ""
echo "===== TESTING TIPS ====="
echo "1. Look for the 'Show Diagnostics' button in the top-right corner of the page"
echo "2. The diagnostic panel will show React status and suggest fixes for any issues"
echo "3. Check the browser console (F12) for detailed error messages"
echo "4. If you encounter any issues, try clearing your browser cache or using incognito mode"
echo ""
echo "===== TROUBLESHOOTING CHECKLIST ====="
echo "✓ process.env polyfill is added to prevent 'process is not defined' errors"
echo "✓ ES6 module compatibility layer is added to handle 'export' syntax errors"
echo "✓ ReactDOM loading is ensured with a shim while the real ReactDOM loads"
echo "✓ A diagnostic panel is available to check React loading status"
echo "✓ Redux and Router context providers are added to fix hook errors"
echo "✓ Module resolution is enhanced to handle relative imports"
echo ""

# Wait for user to press Ctrl+C
wait $SERVER_PID
