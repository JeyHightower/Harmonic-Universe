#!/bin/bash
# Post-start script for Render.com
# This runs just before the application starts

set -e  # Exit on error

echo "Starting Render deployment..."

# Activate virtual environment
source .venv/bin/activate

# Verify Python environment
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo "Virtual env: $VIRTUAL_ENV"

# Verify dependencies
python -c "
import flask
import sqlalchemy
import flask_sqlalchemy
print('All required packages are available')
"

echo "=============== RENDER START SCRIPT ==============="
echo "Current directory: $(pwd)"
echo "Environment: RENDER=${RENDER}"

# Ensure static directory exists with correct permissions
echo "Ensuring static directory exists..."
mkdir -p /opt/render/project/src/static
chmod -R 755 /opt/render/project/src/static

# Verify static directory
echo "Verifying static directory..."
ls -la /opt/render/project/src/static/

# Check for index.html
if [ ! -f "/opt/render/project/src/static/index.html" ]; then
    echo "WARNING: index.html not found!"
fi

echo "Start script completed successfully"
echo "Starting application with Gunicorn..."

# Export additional environment variables
export PYTHONUNBUFFERED=1
export FLASK_ENV=production

# Start Gunicorn with our configuration
exec gunicorn -c gunicorn.conf.py wsgi:app
