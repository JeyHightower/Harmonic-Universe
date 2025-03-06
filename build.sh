#!/bin/bash
set -e  # Exit on error

echo "Starting build process..."

# Print environment information
echo "Node version: $(node -v)"
echo "npm version: $(npm -v)"
echo "Python version: $(python -v)"
echo "Pip version: $(pip --version)"

# Clean pip cache
echo "Cleaning pip cache..."
pip cache purge

# Make sure pip is up to date
echo "Updating pip..."
pip install --upgrade pip

# Install core dependencies first
echo "Installing core dependencies..."
pip install --no-cache-dir flask==2.0.1 Flask-SQLAlchemy==2.5.1 Flask-CORS==3.0.10 Werkzeug==2.0.1

# Install remaining dependencies
echo "Installing remaining dependencies..."
pip install --no-cache-dir -r requirements.txt

# Verify core installations
echo "Verifying core installations:"
pip list | grep -i flask
pip list | grep -i sqlalchemy
pip list | grep -i werkzeug

# Setup python environment
echo "Setting up Python environment..."
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Ensure directory structure
echo "Creating necessary directories..."
mkdir -p static app/core

# Build frontend if it exists
if [ -d "frontend" ]; then
    echo "Building frontend..."
    cd frontend

    # Install dependencies
    npm ci --production

    # Build the React app
    npm run build

    # Move build files to static directory
    echo "Moving build files to static directory..."
    rm -rf ../static/*
    cp -r build/* ../static/

    cd ..
    echo "Frontend build completed!"
else
    echo "No frontend directory found, skipping frontend build."
fi

# Create a simple index.html if it doesn't exist
if [ ! -f "static/index.html" ]; then
    echo "Creating a placeholder index.html..."
    mkdir -p static
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #333; }
        .api-status { background: #f4f4f4; padding: 10px; border-radius: 5px; }
    </style>
</head>
<body>
    <h1>Harmonic Universe API</h1>
    <p>The API is running. Frontend will be available soon.</p>
    <div class="api-status">
        <p>Check API health: <a href="/api/health">/api/health</a></p>
    </div>
</body>
</html>
EOF
fi

# Create a test file to verify the environment
echo "Creating environment test file..."
cat > env_test.py << 'EOF'
import sys
print("Python version:", sys.version)
print("Python path:", sys.path)

try:
    import flask
    print("✅ Flask is available:", flask.__version__)
except ImportError as e:
    print("❌ Flask is not available:", e)

try:
    import sqlalchemy
    print("✅ SQLAlchemy is available:", sqlalchemy.__version__)
except ImportError as e:
    print("❌ SQLAlchemy is not available:", e)
EOF

python env_test.py

echo "Build completed successfully!"
