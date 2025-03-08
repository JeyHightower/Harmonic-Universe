#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip

# Install project dependencies
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# Create a direct path to gunicorn for our start script to use
GUNICORN_PATH=$(which gunicorn)
echo "Gunicorn found at: $GUNICORN_PATH"
echo "export GUNICORN_PATH=$GUNICORN_PATH" > gunicorn_path.sh

# Check if gunicorn is installed and available
if [ -z "$GUNICORN_PATH" ]; then
  echo "ERROR: Gunicorn not found in PATH"
  pip install gunicorn  # Try again
  GUNICORN_PATH=$(which gunicorn)
  echo "Retry - Gunicorn found at: $GUNICORN_PATH"
  echo "export GUNICORN_PATH=$GUNICORN_PATH" > gunicorn_path.sh
fi

# Verify gunicorn installation
pip list | grep gunicorn

# Setup static files if needed
if [ -f app_static_symlink.py ]; then
  python app_static_symlink.py
fi

echo "Build process completed successfully!"
