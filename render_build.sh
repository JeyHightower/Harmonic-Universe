#!/bin/bash
# render_build.sh - Comprehensive build script for Render deployment

set -e  # Exit immediately if any command fails
set -x  # Print each command before execution

echo "Starting build process..."

# Python version check
python --version
which python

# Set up Python environment
python -m venv .venv
source .venv/bin/activate

# Make sure pip is up to date
pip install --upgrade pip

# Install all dependencies with explicit flags to ensure proper installation
pip install -r requirements.txt --no-cache-dir --upgrade

# Verify critical packages are installed
echo "Verifying installed packages..."
pip list | grep Flask
pip list | grep SQLAlchemy
pip list | grep gunicorn

# Create necessary directories
mkdir -p static
echo "Static directory created"

# Make sure static files exist
if [ ! -f "static/index.html" ]; then
  echo "Creating placeholder index.html in static directory"
  cat > static/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">
    <h1>Harmonic Universe is running</h1>
    <p>If you see this message, static files are being served correctly.</p>
  </div>
</body>
</html>
EOL
fi

# Set correct permissions
chmod -R 755 static
chmod 644 static/index.html

echo "Build process completed successfully!"

# Print environment information for debugging
echo "Python packages installed:"
pip freeze

echo "Current directory structure:"
find . -type d -maxdepth 2 | sort
