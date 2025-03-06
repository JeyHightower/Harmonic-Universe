#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "🚀 Starting build process for Harmonic Universe"

# Install Python dependencies for backend
echo "📦 Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure necessary directories exist
echo "📁 Creating necessary directories..."
mkdir -p static

# Setup frontend
if [ -d "frontend" ]; then
    echo "🌐 Setting up frontend..."
    cd frontend

    # Ensure glob is available
    echo "📦 Installing glob dependency..."
    npm install glob --save

    # Fix potential ESM issues with glob in any scripts
    if [ -d "scripts" ]; then
        echo "🔧 Checking for problematic scripts..."

        # Look for potential ES module issues with the glob package
        if [ -f "scripts/clean-ant-icons.js" ]; then
            echo "🔧 Checking clean-ant-icons.js for proper ES module imports..."

            # Create a backup
            cp scripts/clean-ant-icons.js scripts/clean-ant-icons.js.bak

            # Check if it's using problematic direct named imports from glob
            if grep -q "import.*{.*glob.*}.*from.*'glob'" scripts/clean-ant-icons.js; then
                echo "  Fixing named imports from CommonJS glob module"

                # Add the correct ES module import pattern at the top
                TMP_FILE=$(mktemp)
                cat > "$TMP_FILE" << 'EOF'
// Import the CommonJS module correctly in ES module context
import pkg from 'glob';
const { glob } = pkg;

EOF

                # Remove the problematic import line
                grep -v "import.*{.*glob.*}.*from.*'glob'" scripts/clean-ant-icons.js >> "$TMP_FILE"

                # Replace the file
                mv "$TMP_FILE" scripts/clean-ant-icons.js
                chmod +x scripts/clean-ant-icons.js

                echo "✅ Fixed ES module import pattern for glob"
            else
                echo "  clean-ant-icons.js appears to have correct imports"
            fi
        fi

        # Check for any .cjs files that should be converted back to .js with ES module syntax
        for CJS_FILE in scripts/*.cjs; do
            if [ -f "$CJS_FILE" ]; then
                JS_FILE="${CJS_FILE%.cjs}.js"
                echo "🔧 Converting $CJS_FILE to ES module syntax in $JS_FILE"

                # Create ES module version
                cat > "$JS_FILE" << 'EOF'
#!/usr/bin/env node

// Import the CommonJS module correctly in ES module context
import pkg from 'glob';
const { glob } = pkg;

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// In ES modules, __dirname is not available directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Rest of the file logic goes here...
// Customize this based on what the original file was doing
EOF

                # Append the rest of the logic, skipping the CommonJS imports
                sed -n '/const.*require/,$ p' "$CJS_FILE" | grep -v "const.*require" >> "$JS_FILE"

                # Make the new file executable
                chmod +x "$JS_FILE"

                # Update package.json references
                BASE_NAME=$(basename "$CJS_FILE" .cjs)
                sed -i "s/$BASE_NAME\.cjs/$BASE_NAME\.js/g" package.json

                echo "✅ Converted $CJS_FILE to ES module syntax"
            fi
        done
    fi

    # Install all dependencies
    echo "📦 Installing all frontend dependencies..."
    npm ci || npm install

    # Build the frontend
    echo "🏗️ Building frontend..."
    npm run build

    # Move build files to static directory in the root for the API to serve
    echo "📦 Moving frontend build to static directory..."
    rm -rf ../static/*
    cp -r build/* ../static/

    cd ..
    echo "✅ Frontend setup completed"
else
    echo "⚠️ No frontend directory found, skipping frontend build"
fi

echo "✅ Build process completed successfully"
