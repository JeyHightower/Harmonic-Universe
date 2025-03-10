#!/bin/bash

# Set up directories
FRONTEND_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
STATIC_DIR="$FRONTEND_DIR/../static"
REACT_FIXES_DIR="$STATIC_DIR/react-fixes"

# Create necessary directories
mkdir -p "$STATIC_DIR" "$REACT_FIXES_DIR"

# Run Vite build
npx vite build

# Copy build files
cp -r dist/* "$STATIC_DIR/"

# Create version.js
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
    if [ -f "src/utils/$file" ]; then
        cp "src/utils/$file" "$REACT_FIXES_DIR/"
        echo "Copied $file to react-fixes directory"
    else
        echo "Warning: $file not found in utils directory"
    fi
done

echo "Build process completed successfully"
