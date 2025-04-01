#!/bin/bash

# Exit on error
set -e

echo "Starting application at $(date)"
echo "Current directory: $(pwd)"
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"
python --version

# Set Python version explicitly
export PYTHON_VERSION=3.11.0

# Navigate to backend directory
cd backend

# Ensure log directory exists
mkdir -p logs

# Make sure virtual environment exists and is activated
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python -m venv .venv
fi

# Activate virtual environment
source .venv/bin/activate

# Ensure Flask-Caching is installed
echo "Checking Flask-Caching installation..."
pip install --no-cache-dir Flask-Caching==2.1.0

# Attempt to run any pending migrations
echo "Checking for pending database migrations..."
python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing startup"

# Set up environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Determine port - default to 10000 if PORT env var is not set
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Check if gunicorn is available
if command -v gunicorn &> /dev/null; then
    # Start the application with gunicorn
    echo "Starting Gunicorn server..."
    gunicorn \
        --bind 0.0.0.0:$PORT \
        'app:create_app()' \
        --worker-class eventlet \
        --workers 4 \
        --threads 2 \
        --timeout 120 \
        --access-logfile - \
        --error-logfile - \
        --log-level info
else
    # Fallback to Flask development server
    echo "Gunicorn not found, starting Flask development server (NOT RECOMMENDED FOR PRODUCTION)"
    python app.py --host=0.0.0.0 --port=$PORT 
fi 