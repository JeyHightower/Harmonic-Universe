#!/bin/bash
set -e  # Exit immediately if a command fails
set -x  # Print each command before execution

echo "Starting application..."

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export FLASK_APP=app.py
export PORT=10000
export PYTHONPATH="${PYTHONPATH}:/opt/render/project/src"

# Set up static directories
echo "Setting up static directories..."
python setup_static.py

# Create symlinks for legacy paths
echo "Setting up legacy path compatibility..."
mkdir -p /app
ln -sf /opt/render/project/src/static /app/static || echo "Could not create symlink (this is ok)"

# Print environment information for debugging
echo "Environment information:"
echo "Python version: $(python --version)"
echo "Flask version: $(pip show flask | grep Version)"
echo "Current directory: $(pwd)"
echo "PYTHONPATH: $PYTHONPATH"
echo "FLASK_APP: $FLASK_APP"
echo "PORT: $PORT"
echo "Static directory: $(python -c "import os; print(os.path.exists('/opt/render/project/src/static'))")"

# Start the application with Gunicorn
echo "Starting Gunicorn server on port $PORT..."
exec gunicorn --bind=0.0.0.0:$PORT --workers=2 --log-level=info app:app
