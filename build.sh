#!/bin/bash
# build.sh - Render.com build script

# Install Python dependencies
pip install -r backend/requirements.txt
# Make sure gunicorn is installed
pip install gunicorn
# Build the React frontend
cd frontend && npm install && npm run build
# Copy built frontend to Flask static directory
cd ..
mkdir -p static/assets
cp -r frontend/dist/* static/

# Create fallback ant-icons.js if it doesn't exist
if [ ! -f "static/assets/ant-icons.js" ]; then
  echo "Creating fallback ant-icons.js"
  echo "// Fallback Ant Icons implementation" > static/assets/ant-icons.js
  echo "console.log('Using minimal ant-icons fallback');" >> static/assets/ant-icons.js
  echo "window.__ANT_ICONS_VERSION__ = '4.2.1';" >> static/assets/ant-icons.js
  echo "const IconContext = {Provider: function(props) { return props.children; }, Consumer: function() {}};" >> static/assets/ant-icons.js
  echo "window.IconContext = IconContext;" >> static/assets/ant-icons.js
fi

# Create and copy the Ant Design version polyfill
cat > static/ant-design-polyfill.js << 'EOL'
// Polyfill for Ant Design Icons version
(function() {
  console.log("Applying Ant Design Icons polyfill");
  // (rest of the polyfill code)
})();
EOL

# Copy our comprehensive fallback to the root static directory
cp -v static/ant-icons.js static/assets/ || echo "Fallback script not found in root, creating minimal one"

# Ensure assets directory exists and has correct permissions
if [ -d "frontend/dist/assets" ]; then
  cp -rv frontend/dist/assets/* static/assets/ || true
fi

# Make a copy of the ant-icons file without hash for direct access
find static/assets -name "ant-icons-*.js" -exec cp {} static/assets/ant-icons.js \; || echo "No hashed ant-icons file found"

# Set permissions for the polyfill
chmod -R 755 static
chmod 644 static/ant-design-polyfill.js

# Find and patch the utils.js file
# (file patching commands)

# Direct fix for utils.js at line 85
find static/assets -name "utils-*.js" -exec sed -i '85s/\([a-zA-Z0-9_$.]\+\)\.version/(\1 || {version:"4.2.1"}).version/g' {} \;

# List contents to verify
# (verification commands)

# Make sure the polyfill scripts are copied
cp frontend/public/react-polyfill.js static/ 2>/dev/null || echo "Polyfill script not found"
cp frontend/public/react-context-provider.js static/ 2>/dev/null || echo "Context provider script not found"

# Verify the final structure
echo "Final static directory structure:"
find static -type f | sort
