#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Python version: $(python --version)"

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install gunicorn

# Install requirements if requirements.txt exists
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# Verify gunicorn installation
which gunicorn || echo "WARNING: gunicorn not found in PATH"
pip list | grep gunicorn

# Setup static files if needed
if [ -f app_static_symlink.py ]; then
  python app_static_symlink.py
fi

echo "Build process completed successfully!"
