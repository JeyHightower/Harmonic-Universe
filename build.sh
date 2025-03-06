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

    # Check for scripts using CommonJS require() syntax
    if [ -d "scripts" ]; then
        echo "🔧 Checking for CommonJS scripts..."

        # Find scripts using require()
        COMMONJS_FILES=$(grep -l "require(" scripts/*.js | grep -v "node_modules")

        # Convert identified files to .cjs if needed
        if [ ! -z "$COMMONJS_FILES" ]; then
            echo "Found CommonJS scripts:"
            for file in $COMMONJS_FILES; do
                cjs_file="${file%.js}.cjs"

                # Check if the .cjs version doesn't exist yet
                if [ ! -f "$cjs_file" ]; then
                    echo "  Converting $file to $cjs_file"
                    cp "$file" "$cjs_file"
                    # Make the cjs file executable
                    chmod +x "$cjs_file"
                else
                    echo "  $cjs_file already exists"
                fi

                # Update package.json references
                js_name=$(basename "$file")
                cjs_name=$(basename "$cjs_file")
                if grep -q "$js_name" package.json; then
                    echo "  Updating package.json references for $js_name"
                    sed -i "s|$js_name|$cjs_name|g" package.json
                fi
            done
        else
            echo "No CommonJS scripts found needing conversion"
        fi
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
    cp -r dist/* ../static/

    cd ..
    echo "✅ Frontend setup completed"
else
    echo "⚠️ No frontend directory found, skipping frontend build"
fi

echo "✅ Build process completed successfully"
