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

# Print debugging information about the static directory
echo "Checking static directory..."
if [ -d "static" ]; then
    echo "Static directory exists"
    echo "Static directory contents:"
    ls -la static
    
    if [ -f "static/index.html" ]; then
        echo "index.html exists in static directory"
        echo "First 10 lines of index.html:"
        head -n 10 static/index.html
    else
        echo "WARNING: index.html not found in static directory"
    fi
    
    if [ -d "static/assets" ]; then
        echo "assets directory exists"
        echo "Assets directory contents:"
        ls -la static/assets | head -n 10
        echo "(showing first 10 files only)"
    else
        echo "WARNING: assets directory not found in static"
    fi
else
    echo "WARNING: Static directory does not exist"
    echo "Creating static directory..."
    mkdir -p static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found. Please check build process.</p></body></html>" > static/index.html
    echo "<html><body><h1>Test Page</h1><p>This is a test.</p></body></html>" > static/test.html
    echo "Created basic static files"
fi

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

# Create a temporary test script to verify Flask static file serving
cat > test_static.py << 'EOF'
from flask import Flask, send_from_directory
import os

app = Flask(__name__, static_folder="static", static_url_path="")

@app.route('/test')
def test():
    return "This is a test endpoint"

@app.route('/debug')
def debug():
    result = {
        "static_folder_exists": os.path.exists(app.static_folder),
        "static_folder_path": os.path.abspath(app.static_folder),
        "static_url_path": app.static_url_path,
        "files": []
    }
    
    if os.path.exists(app.static_folder):
        result["files"] = os.listdir(app.static_folder)
        result["index_exists"] = "index.html" in result["files"]
    
    return result

@app.route('/')
def index():
    return send_from_directory(app.static_folder, 'index.html')

@app.route('/<path:path>')
def serve_static(path):
    if os.path.exists(os.path.join(app.static_folder, path)):
        return send_from_directory(app.static_folder, path)
    return send_from_directory(app.static_folder, 'index.html')

if __name__ == '__main__':
    app.run(debug=True, port=10000)
EOF

echo "Created test script to verify static file serving"

# Attempt to run any pending migrations
echo "Checking for pending database migrations..."
python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing startup"

# Set up environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Output app.py configuration for debugging
echo "Checking app.py configuration..."
grep -n "static_folder\|static_url_path\|send_from_directory\|send_static_file" app.py || echo "Static file configuration not found in app.py"

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