#!/bin/bash
# Simple start script for Render.com

set -e  # Exit on any error

echo "=== Starting Harmonic Universe on Render.com ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Ensure static directory exists
export STATIC_DIR="/opt/render/project/src/static"
mkdir -p $STATIC_DIR
echo "Created static directory: $STATIC_DIR"

# Create app/static directory and symlink
mkdir -p app/static
echo "Created app/static directory"

# Run the setup script
echo "Running setup script..."
python setup_render.py

# Start the application with Gunicorn
echo "Starting Gunicorn..."
gunicorn render_wsgi:app --bind=0.0.0.0:${PORT:-8000} --workers=1 --timeout=120
