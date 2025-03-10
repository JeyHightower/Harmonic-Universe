#!/bin/bash

# Set up directories
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="$FRONTEND_DIR/../static"
REACT_FIXES_DIR="$STATIC_DIR/react-fixes"
DIST_DIR="$FRONTEND_DIR/dist"

# Create necessary directories
mkdir -p "$STATIC_DIR" "$REACT_FIXES_DIR"

# Run Vite build
echo "Running Vite build..."
cd "$FRONTEND_DIR" && npm run vite build

# Check if build was successful
if [ ! -d "$DIST_DIR" ]; then
    echo "Error: Build failed - dist directory not created"
    exit 1
fi

# Copy build files
echo "Copying build files..."
cp -r "$DIST_DIR"/* "$STATIC_DIR/" || {
    echo "Error: Failed to copy build files"
    exit 1
}

# Create version.js
echo "Creating version.js..."
echo "window.BUILD_VERSION = '$(date +%s)';" > "$STATIC_DIR/version.js"

# Create build-info.json
cat > "$STATIC_DIR/build-info.json" << EOL
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "1.0.0",
    "environment": "${NODE_ENV:-production}"
}
EOL

# Copy React fix files
cp "$FRONTEND_DIR/src/utils/ensure-react-dom.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-react-dom.js to react-fixes directory"
cp "$FRONTEND_DIR/src/utils/ensure-redux-provider.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-redux-provider.js to react-fixes directory"
cp "$FRONTEND_DIR/src/utils/ensure-router-provider.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-router-provider.js to react-fixes directory"
cp "$FRONTEND_DIR/src/utils/fallback.js" "$REACT_FIXES_DIR/" && echo "Copied fallback.js to react-fixes directory"

echo "Build process completed successfully"
