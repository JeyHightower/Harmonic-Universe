#!/bin/bash

# Exit on error
set -e

# Echo commands as they're executed for better debugging
set -x

# Export Node options to increase memory limit if needed
export NODE_OPTIONS="--max-old-space-size=4096"

# Check for frontend directory
if [ ! -d "frontend" ]; then
    echo "Frontend directory does not exist."
    exit 1
fi

# Install frontend dependencies and build
cd frontend
if [ -d "node_modules" ]; then
    echo "Cleaning previous node_modules installation..."
    rm -rf node_modules
fi

echo "Installing frontend dependencies..."
# First try with npm ci for exact versions
npm ci || {
    echo "npm ci failed, falling back to npm install..."
    # Explicitly install with both production and development dependencies
    npm install --production=false
}

# Verify critical packages are installed
CRITICAL_PACKAGES=("vite" "@vitejs/plugin-react" "react" "react-dom" "@reduxjs/toolkit" "react-router-dom")
MISSING_PACKAGES=()

echo "Verifying critical dependencies..."
for package in "${CRITICAL_PACKAGES[@]}"
do
    if ! npm list "$package" --depth=0 | grep -q "$package"; then
        echo "Critical package $package is missing, installing it explicitly..."
        MISSING_PACKAGES+=("$package")
    else
        echo "✅ $package is installed."
    fi
done

# Install any missing critical packages
if [ ${#MISSING_PACKAGES[@]} -gt 0 ]; then
    echo "Installing missing critical packages: ${MISSING_PACKAGES[*]}"
    npm install "${MISSING_PACKAGES[@]}" --save-dev --no-audit
fi

# Double-check vite installation as it's crucial for the build
if ! npm list vite --depth=0 | grep -q "vite"; then
    echo "Vite is still not installed after verification. Installing it explicitly..."
    npm install vite --save-dev --no-audit
    # Also install it globally as a fallback
    npm install -g vite
fi

# Set environment variables for the build
export CI=false
export VITE_APP_ENV=production

echo "Starting frontend build..."
npm run build || {
    echo "Build failed. Trying with explicit vite execution..."
    # If the build fails, try running vite build directly
    npx vite build || {
        echo "Direct vite build failed. Trying with global vite..."
        vite build
    }
}
echo "Frontend build completed."

# Check for backend directory
if [ ! -d "../backend" ]; then
    echo "Backend directory does not exist."
    exit 1
fi

# Move to backend
cd ../backend

# Install backend dependencies
echo "Installing backend dependencies..."
pip install -r requirements.txt
pip install psycopg2 

# Run database migrations and seed data
echo "Running database migrations..."
flask db upgrade
echo "Seeding database..."
flask seed all

echo "Build completed successfully!" 