#!/bin/bash

# Exit on error
set -e

echo "Starting build process for Harmonic Universe"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v || echo 'Node.js not found')"
echo "NPM version: $(npm -v || echo 'NPM not found')"

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Install JavaScript dependencies
echo "Installing JavaScript dependencies for root project..."
npm install

# Build frontend
echo "Building frontend application..."
cd frontend
npm install
npm run build
cd ..

# Verify the build
echo "Verifying frontend build..."
if [ -d "frontend/dist" ]; then
    echo "Frontend build successful."
    
    # Create static directory if it doesn't exist
    mkdir -p backend/static
    
    # Copy frontend build to static directory
    echo "Copying frontend build to backend/static..."
    cp -r frontend/dist/* backend/static/
    
    echo "Frontend build deployed to static directory."
else
    echo "WARNING: Frontend build directory not found."
fi

# Create a test HTML file to verify static file serving
echo "Creating test.html in static directory..."
cat > backend/static/test.html << 'EOL'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe Test Page</title>
</head>
<body>
    <h1>Harmonic Universe Test Page</h1>
    <p>If you can see this, static file serving is working!</p>
</body>
</html>
EOL

# Set up database if needed
echo "Setting up database..."
cd backend
python init_migrations.py || echo "Warning: Database initialization failed, continuing anyway"
cd ..

echo "Build process complete." 