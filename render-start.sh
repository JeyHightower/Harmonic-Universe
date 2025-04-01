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

# Explicitly install all required dependencies
echo "Installing all required Flask extensions..."
pip install --no-cache-dir flask==2.3.3 werkzeug==2.3.7
pip install --no-cache-dir flask-sqlalchemy==3.1.1 sqlalchemy==2.0.23
pip install --no-cache-dir flask-migrate==4.0.5 flask-cors==4.0.0 
pip install --no-cache-dir flask-jwt-extended==4.6.0 flask-bcrypt==1.0.1
pip install --no-cache-dir flask-login==0.6.3 flask-socketio==5.3.6
pip install --no-cache-dir python-dotenv==1.0.0 alembic==1.12.1
pip install --no-cache-dir gunicorn==21.2.0 eventlet==0.33.3
pip install --no-cache-dir flask-caching==2.1.0

# Install security related packages
echo "Installing security dependencies..."
pip install --no-cache-dir flask-limiter==3.5.0 limits==3.7.0
pip install --no-cache-dir flask-talisman==1.1.0
pip install --no-cache-dir bcrypt==4.0.1 pyjwt==2.8.0 passlib==1.7.4 cryptography==41.0.7

# Install other essential dependencies
echo "Installing database dependencies..."
pip install --no-cache-dir psycopg2-binary==2.9.9 redis==5.0.1

# Install utility packages
echo "Installing utility packages..."
pip install --no-cache-dir python-magic==0.4.27 requests==2.31.0 structlog==24.1.0 psutil==5.9.8

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