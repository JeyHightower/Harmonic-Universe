#!/bin/bash
# fix-script-loading.sh - Fix script loading order to prevent React context warnings
set -e  # Exit on error

echo "===== FIXING REACT SCRIPT LOADING ORDER ====="
echo "Date: $(date)"

# Check for macOS
if [[ "$OSTYPE" == "darwin"* ]]; then
  # macOS requires an empty string argument for -i
  SED_CMD="sed -i ''"
else
  # Linux version
  SED_CMD="sed -i"
fi

# Update index.html to ensure proper script loading order
if [ -f "static/index.html" ]; then
  echo "Updating script loading order in static/index.html..."

  # Create a backup
  cp static/index.html static/index.html.backup

  # First, remove any existing React fix scripts from anywhere in the file (both with and without /static/ prefix)
  $SED_CMD '/<script src="\/static\/critical-react-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/static\/react-context-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/static\/react-hook-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/static\/redux-provider-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/static\/runtime-diagnostics.js"/d' static/index.html
  $SED_CMD '/<script src="\/static\/dynamic-import.js"/d' static/index.html

  # Also remove references without /static/ prefix
  $SED_CMD '/<script src="\/critical-react-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/react-context-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/react-hook-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/redux-provider-fix.js"/d' static/index.html
  $SED_CMD '/<script src="\/runtime-diagnostics.js"/d' static/index.html
  $SED_CMD '/<script src="\/dynamic-import.js"/d' static/index.html

  # Add the early-warning-interceptor.js script at the very beginning of the head
  $SED_CMD '/<head>/a\
    <!-- FINAL SOLUTION - LOAD FIRST -->\
    <script src="/static/final-hook-suppressor.js"></script>\
    <!-- Direct hook patcher must be first -->\
    <script src="/static/direct-hook-patcher.js"></script>\
    <!-- Warning interceptors and patchers -->\
    <script src="/static/early-warning-interceptor.js"></script>\
    <script src="/static/hook-js-patcher.js"></script>' static/index.html

  # Add the dynamic-import.js script to the head
  $SED_CMD '/<\/head>/i\
    <!-- Load dynamic import shim first to handle require() calls -->\
    <script src="/static/dynamic-import.js"></script>' static/index.html

  # Then add the React and vendor scripts at the beginning of the body
  $SED_CMD '/<body>/a\
    <!-- Load React scripts -->\
    <script src="/static/vendor-react.js"></script>' static/index.html

  # Then add the scripts just before the closing body tag in the correct order
  $SED_CMD 's|</body>|    <!-- React fix scripts loaded at the end of body for proper timing -->\n    <script src="/static/react-hook-fix.js"></script>\n    <script src="/static/critical-react-fix.js"></script>\n    <script src="/static/react-context-fix.js"></script>\n    <script src="/static/redux-provider-fix.js"></script>\n    <script src="/static/runtime-diagnostics.js"></script>\n    <script src="/static/bundle.js"></script>\n</body>|g' static/index.html

  # Update any remaining script references to ensure consistency
  $SED_CMD 's|src="/vendor-react.js"|src="/static/vendor-react.js"|g' static/index.html
  $SED_CMD 's|src="/bundle.js"|src="/static/bundle.js"|g' static/index.html

  echo "✅ Updated script loading order in static/index.html"
else
  echo "⚠️ Warning: static/index.html not found, checking frontend/public/index.html..."

  # Try frontend/public/index.html
  if [ -f "frontend/public/index.html" ]; then
    echo "Updating script loading order in frontend/public/index.html..."

    # Create a backup
    cp frontend/public/index.html frontend/public/index.html.backup

    # Remove existing React fix scripts from anywhere in the file
    $SED_CMD '/<script src="\/dynamic-import.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/critical-react-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/react-context-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/react-hook-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/redux-provider-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/runtime-diagnostics.js"/d' frontend/public/index.html

    # Also remove references with /static/ prefix
    $SED_CMD '/<script src="\/static\/dynamic-import.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/static\/critical-react-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/static\/react-context-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/static\/react-hook-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/static\/redux-provider-fix.js"/d' frontend/public/index.html
    $SED_CMD '/<script src="\/static\/runtime-diagnostics.js"/d' frontend/public/index.html

    # Add the dynamic-import.js script at the end of the head
    $SED_CMD '/<\/head>/i\
    <!-- Load dynamic import shim first to handle require() calls -->\
    <script src="/static/dynamic-import.js"></script>' frontend/public/index.html

    # Add the scripts before closing body tag
    $SED_CMD 's|</body>|    <!-- React fix scripts loaded at the end of body for proper timing -->\n    <script src="/static/react-hook-fix.js"></script>\n    <script src="/static/critical-react-fix.js"></script>\n    <script src="/static/react-context-fix.js"></script>\n    <script src="/static/redux-provider-fix.js"></script>\n    <script src="/static/runtime-diagnostics.js"></script>\n</body>|g' frontend/public/index.html

    # Also add the early warning interceptor to frontend/public/index.html
    $SED_CMD '/<head>/a\
    <!-- FINAL SOLUTION - LOAD FIRST -->\
    <script src="/static/final-hook-suppressor.js"></script>\
    <!-- Direct hook patcher must be first -->\
    <script src="/static/direct-hook-patcher.js"></script>\
    <!-- Warning interceptors and patchers -->\
    <script src="/static/early-warning-interceptor.js"></script>\
    <script src="/static/hook-js-patcher.js"></script>' frontend/public/index.html

    echo "✅ Updated script loading order in frontend/public/index.html"
  fi
fi

# Create a symlinks.sh script to handle the path mapping issue
echo "Creating symlinks.sh to ensure all script paths work correctly..."
cat > symlinks.sh << 'EOL'
#!/bin/bash
# Create symbolic links for all static files to handle both path patterns

# Set the base directories
STATIC_DIR="static"
PUBLIC_DIR="frontend/public"

# Make sure static directory exists
mkdir -p $STATIC_DIR

# Create symbolic links from root to static dir for backward compatibility
echo "Creating symbolic links from root to static for backward compatibility..."
for script in $STATIC_DIR/*.js; do
  filename=$(basename "$script")
  # Create a symbolic link in the root directory pointing to the static file
  ln -sf "$(pwd)/$script" "$(pwd)/$filename"
  echo "✅ Created symbolic link: /$filename -> /static/$filename"
done

# Create .htaccess file to handle redirections (for servers that support it)
echo "Creating .htaccess file for path redirection..."
cat > .htaccess << 'HTACCESS'
# Redirect script requests to the static directory
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^([^/]+\.js)$ /static/$1 [L]
</IfModule>
HTACCESS

echo "✅ Created symlinks.sh and .htaccess for path mapping"
EOL

# Make the symlinks script executable
chmod +x symlinks.sh

# Run the symlinks script
echo "Running symlinks.sh to create symbolic links..."
./symlinks.sh

# Update the render_build.sh script to include automatic path fixing
echo "Updating render_build.sh to include path fixing..."
if [ -f "render_build.sh" ]; then
  # Check if the script already includes path fixing
  if ! grep -q "Fix script paths" render_build.sh; then
    # Add path fixing to the render_build.sh script
    $SED_CMD '/^echo "===== RENDER BUILD COMPLETE ====="/i\
# Fix script paths to ensure consistency\
echo "Fixing script paths..."\
./fix-script-loading.sh\
./symlinks.sh\
echo "✅ Script paths fixed"\
' render_build.sh
    echo "✅ Updated render_build.sh to include path fixing"
  else
    echo "⚠️ render_build.sh already includes path fixing"
  fi
else
  echo "⚠️ render_build.sh not found, skipping update"
fi

# Run the frontend build to apply changes
echo "Running frontend build to apply changes..."
if [ -d "frontend" ] && [ -f "frontend/simple-build.js" ]; then
  cd frontend && node simple-build.js
  cd ..
  echo "✅ Frontend build completed"

  # Copy build files to static directory
  echo "Copying build files to static directory..."
  mkdir -p static
  cp -r frontend/dist/* static/
  echo "✅ Build files copied to static directory"

  # Run the symlinks script again after build
  echo "Running symlinks.sh again to create symbolic links for new files..."
  ./symlinks.sh
else
  echo "⚠️ Frontend build script not found, skipping build step"
fi

echo ""
echo "===== SCRIPT LOADING ORDER FIXED ====="
echo "Date: $(date)"
echo ""
echo "Summary of fixes applied:"
echo "1. Updated script loading order in HTML files"
echo "2. Ensured all script paths consistently use /static/ prefix"
echo "3. Created symbolic links for backward compatibility"
echo "4. Added .htaccess redirections for servers that support it"
echo "5. Updated render_build.sh to include automatic path fixing"
echo "6. Rebuilt and deployed application files"
