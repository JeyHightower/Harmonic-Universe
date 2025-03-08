#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# Install gunicorn and other critical dependencies
echo "Installing critical dependencies..."
pip install --upgrade pip
pip install gunicorn==21.2.0
pip install -U setuptools

# Verify Python path
echo "Python path:"
python -c "import sys; print(sys.path)"

# Install project dependencies
echo "Installing project dependencies..."
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# Verify gunicorn installation
echo "Verifying gunicorn installation:"
python -m pip list | grep gunicorn
python -c "import gunicorn; print(f'Gunicorn version: {gunicorn.__version__}')" || echo "Failed to import gunicorn"

# Make gunicorn directly available
echo "Making gunicorn accessible:"
which gunicorn || echo "gunicorn not in PATH"
python -m gunicorn --version || echo "Cannot run gunicorn as a module"

# Setup static files if needed
if [ -f app_static_symlink.py ]; then
  python app_static_symlink.py
fi

echo "Build process completed successfully!"
