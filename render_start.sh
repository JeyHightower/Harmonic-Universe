#!/bin/bash
# Post-start script for Render.com
# This runs just before the application starts

set -e  # Exit on error

echo "=============== RENDER START SCRIPT ==============="
echo "Current directory: $(pwd)"
echo "Environment: RENDER=${RENDER}"

# Ensure virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Creating..."
    python -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Verify Python environment
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo "Virtual env: $VIRTUAL_ENV"

# Verify dependencies are installed
echo "Verifying dependencies..."
python -c "
import flask
import sqlalchemy
import flask_sqlalchemy
print(f'Flask version: {flask.__version__}')
print(f'SQLAlchemy version: {sqlalchemy.__version__}')
print(f'Flask-SQLAlchemy version: {flask_sqlalchemy.__version__}')
print('All required packages are available')
"

# Ensure static directory exists with correct permissions
echo "Ensuring static directory exists..."
mkdir -p /opt/render/project/src/static
chmod -R 755 /opt/render/project/src/static

# Verify static directory
echo "Verifying static directory..."
ls -la /opt/render/project/src/static/

# Check for index.html
if [ ! -f "/opt/render/project/src/static/index.html" ]; then
    echo "WARNING: index.html not found in static directory!"
    echo "Attempting to copy from local static directory..."
    if [ -f "static/index.html" ]; then
        cp static/index.html /opt/render/project/src/static/
        chmod 644 /opt/render/project/src/static/index.html
    fi
fi

# Export additional environment variables
export PYTHONUNBUFFERED=1
export FLASK_ENV=production
export STATIC_DIR=/opt/render/project/src/static

echo "Start script completed successfully"
echo "Starting application with Gunicorn..."

# Start Gunicorn with our configuration
exec gunicorn -c gunicorn.conf.py wsgi:app
