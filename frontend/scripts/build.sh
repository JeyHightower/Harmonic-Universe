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
cd "$FRONTEND_DIR" && npx vite build

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
cat > "$STATIC_DIR/version.js" << EOL
export const version = {
    react: '18.2.0',
    build: '$(date -u +"%Y-%m-%dT%H:%M:%SZ")',
    environment: '${NODE_ENV:-production}'
};
EOL

# Create build-info.json
cat > "$STATIC_DIR/build-info.json" << EOL
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "version": "1.0.0",
    "environment": "${NODE_ENV:-production}"
}
EOL

# Copy React fixes
for file in ensure-react-dom.js ensure-redux-provider.js ensure-router-provider.js fallback.js; do
    if [ -f "$FRONTEND_DIR/src/utils/$file" ]; then
        cp "$FRONTEND_DIR/src/utils/$file" "$REACT_FIXES_DIR/"
        echo "Copied $file to react-fixes directory"
    else
        echo "Warning: $file not found in utils directory"
    fi
done

echo "Build process completed successfully"
