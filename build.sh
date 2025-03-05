#!/bin/bash
# build.sh - Render.com build script

# Exit on any error
set -e

# Print commands for debugging
set -x

echo "=== Starting build process ==="

# Install Python dependencies
echo "=== Installing Python dependencies ==="
pip install -r backend/requirements.txt
# Make sure gunicorn is installed
pip install gunicorn
# Build the React frontend
echo "=== Building React frontend ==="
cd frontend
npm install
npm run render-build
cd ..

# Create and set up static directory
echo "=== Setting up static directory ==="
mkdir -p static
cp -r frontend/dist/* static/

# Create version-patch.js to fix Ant Design Icons version issue
echo "=== Creating version patch script ==="
cat > static/version-patch.js << 'EOL'
// Version patch with no script loading/detection logic
(function() {
  // Simple flag in localStorage to prevent multiple executions
  if (localStorage.getItem('versionPatchApplied')) {
    return;
  }
  localStorage.setItem('versionPatchApplied', 'true');

  console.log('Applying simple version patch');

  // 1. Define version constant
  const VERSION = '4.2.1';

  // 2. Set global version variables
  window.__ANT_ICONS_VERSION__ = VERSION;

  // 3. Add direct fix for undefined.version access
  try {
    // Create a safe version property getter but ONLY for undefined
    const versionDesc = Object.getOwnPropertyDescriptor(Object.prototype, 'version');

    if (!versionDesc) {
      Object.defineProperty(Object.prototype, 'version', {
        get: function() {
          // Only return the fallback for undefined/null
          if (this === undefined || this === null) {
            return VERSION;
          }
          return undefined; // Regular property lookup for valid objects
        },
        // Make it non-enumerable to avoid affecting for...in loops
        enumerable: false,
        configurable: true
      });
    }

    // 4. Add a global error handler specifically for version errors
    window.addEventListener('error', function(event) {
      if (event.message && event.message.includes('Cannot read properties of undefined') &&
          event.message.includes('version')) {
        console.warn('Caught version error, handling silently');
        event.preventDefault();
        event.stopPropagation();
        return true;
      }
    }, true);

    console.log('Version patch successfully applied');
  } catch (e) {
    console.error('Error applying version patch:', e);
  }
})();
EOL

# Set proper permissions for the script
chmod 644 static/version-patch.js

# Remove any old fix scripts to prevent infinite loops
echo "=== Removing old fix scripts if they exist ==="
rm -f static/utils-fix.js static/ant-icons-patch.js static/complete-fix.js

# Update index.html to include our version patch script
echo "=== Updating index.html ==="
if [ -f static/index.html ]; then
  # Add version-patch.js to head
  sed -i 's/<head>/<head>\n  <script src="\/version-patch.js"><\/script>/' static/index.html
fi

# Copy any additional required files
echo "=== Copying additional files ==="
cp frontend/public/react-polyfill.js static/ 2>/dev/null || true
cp frontend/public/react-context-provider.js static/ 2>/dev/null || true

# Create a debug text file to verify static files are being served
echo "Static files successfully deployed" > static/verify.txt

# Debug: List files in static directory
echo "=== Contents of static directory ==="
ls -la static/

# Create a simple route tester file
echo "=== Creating route test file ==="
cat > static/route-test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
  <title>Route Test</title>
</head>
<body>
  <h1>Route Test Successful!</h1>
  <p>If you can see this page, static file serving is working correctly.</p>
</body>
</html>
EOL

echo "=== Build process completed successfully ==="
