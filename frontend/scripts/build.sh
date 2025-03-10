#!/bin/bash

# Set up directories
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="$FRONTEND_DIR/static"
REACT_FIXES_DIR="$STATIC_DIR/react-fixes"
DIST_DIR="$FRONTEND_DIR/dist"

# Create necessary directories
echo "Creating directories..."
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

# Ensure React production files are present
echo "Copying React production files..."
cp "$FRONTEND_DIR/node_modules/react/umd/react.production.min.js" "$STATIC_DIR/" || echo "Warning: Could not copy react.production.min.js"
cp "$FRONTEND_DIR/node_modules/react-dom/umd/react-dom.production.min.js" "$STATIC_DIR/" || echo "Warning: Could not copy react-dom.production.min.js"

# Copy React fix files from src/utils to react-fixes
echo "Copying React fix files..."
for file in ensure-react-dom.js ensure-redux-provider.js ensure-router-provider.js fallback.js; do
    if [ -f "$FRONTEND_DIR/src/utils/$file" ]; then
        cp "$FRONTEND_DIR/src/utils/$file" "$REACT_FIXES_DIR/" && echo "Copied $file"
    else
        echo "Warning: $file not found in src/utils"
    fi
done

# Copy additional React fixes
echo "Copying additional React fixes..."
for file in critical-react-fix.js runtime-diagnostics.js react-fallback.js; do
    if [ -f "$STATIC_DIR/$file" ]; then
        cp "$STATIC_DIR/$file" "$REACT_FIXES_DIR/" && echo "Copied $file"
    else
        echo "Warning: $file not found in static directory"
    fi
done

# Create consolidated fixes file
echo "Creating consolidated fixes file..."
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

# Copy consolidated fixes to react-fixes directory
echo "Copying consolidated React fixes..."
if [ -d "$REACT_FIXES_DIR" ]; then
    cp "$STATIC_DIR/consolidated-fixes.js" "$REACT_FIXES_DIR/" && echo "Copied consolidated-fixes.js"
else
    echo "Error: React fixes directory not found"
    exit 1
fi

echo "Build process completed successfully"
