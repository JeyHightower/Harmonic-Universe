#!/bin/bash

# Set up directories
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="$FRONTEND_DIR/static"
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

# Copy React fix files from src/utils to static/react-fixes
echo "Copying React fix files..."
cp "$FRONTEND_DIR/src/utils/ensure-react-dom.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-react-dom.js"
cp "$FRONTEND_DIR/src/utils/ensure-redux-provider.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-redux-provider.js"
cp "$FRONTEND_DIR/src/utils/ensure-router-provider.js" "$REACT_FIXES_DIR/" && echo "Copied ensure-router-provider.js"
cp "$FRONTEND_DIR/src/utils/fallback.js" "$REACT_FIXES_DIR/" && echo "Copied fallback.js"

# Copy additional React fix files
echo "Copying additional React fixes..."
cp "$STATIC_DIR/critical-react-fix.js" "$REACT_FIXES_DIR/" && echo "Copied critical-react-fix.js"
cp "$STATIC_DIR/runtime-diagnostics.js" "$REACT_FIXES_DIR/" && echo "Copied runtime-diagnostics.js"
cp "$STATIC_DIR/react-fallback.js" "$REACT_FIXES_DIR/" && echo "Copied react-fallback.js"

# Consolidate React fixes
echo "Consolidating React fixes..."
cat > "$STATIC_DIR/consolidated-fixes.js" << EOL
// Consolidated React fixes
import './react-fixes/critical-react-fix.js';
import './react-fixes/runtime-diagnostics.js';
import './react-fixes/react-fallback.js';
import './react-fixes/ensure-react-dom.js';
import './react-fixes/ensure-redux-provider.js';
import './react-fixes/ensure-router-provider.js';
import './react-fixes/fallback.js';
EOL

echo "Build process completed successfully"
