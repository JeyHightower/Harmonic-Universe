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
        echo "Creating minimal index.html..."
        cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Harmonic Universe</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 0; padding: 20px; text-align: center; }
    h1 { color: #333; }
    .container { max-width: 800px; margin: 0 auto; }
  </style>
</head>
<body>
  <div class="container">
    <h1>Harmonic Universe</h1>
    <p>Welcome to Harmonic Universe. Using emergency static file.</p>
    <div id="root"></div>
  </div>
</body>
</html>
EOF
    fi
    
    if [ -d "static/assets" ]; then
        echo "assets directory exists"
        echo "Assets directory contents (first 10 files):"
        ls -la static/assets | head -n 10
    else
        echo "WARNING: assets directory not found in static"
        mkdir -p static/assets
    fi
else
    echo "ERROR: Static directory does not exist"
    echo "The build process may have failed. Please check render-build.sh logs."
    # Create minimal static directory for diagnostic purposes
    mkdir -p static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found. Please check build process.</p></body></html>" > static/index.html
fi

# Create a whitenoise config file to set MIME types
echo "Creating whitenoise config file for MIME types..."
cat > static/mimetype.ini << 'EOF'
[mimetypes]
.js=application/javascript
.mjs=application/javascript
.css=text/css
.svg=image/svg+xml
.json=application/json
EOF

# Ensure log directory exists
mkdir -p logs

# Explicitly install required dependencies for production
echo "Installing production dependencies..."
# Core Flask dependencies
pip install --no-cache-dir flask==2.3.3 werkzeug==2.3.7
pip install --no-cache-dir flask-sqlalchemy==3.1.1 sqlalchemy==2.0.23
pip install --no-cache-dir flask-migrate==4.0.5 flask-cors==4.0.0 
pip install --no-cache-dir flask-jwt-extended==4.6.0 flask-bcrypt==1.0.1
pip install --no-cache-dir flask-login==0.6.3 flask-socketio==5.3.6
pip install --no-cache-dir python-dotenv==1.0.0 alembic==1.12.1
pip install --no-cache-dir gunicorn==21.2.0 eventlet==0.33.3
pip install --no-cache-dir flask-caching==2.1.0

# Additional dependencies that might be required
pip install --no-cache-dir psycopg2-binary==2.9.9  # PostgreSQL adapter
pip install --no-cache-dir redis==5.0.1  # Redis client
pip install --no-cache-dir requests==2.31.0  # HTTP requests
pip install --no-cache-dir whitenoise==6.5.0  # Static file serving

# Check if requirements.txt exists and install from it
if [ -f "requirements.txt" ]; then
    echo "Installing from requirements.txt..."
    pip install --no-cache-dir -r requirements.txt
fi

# Attempt to run any pending migrations
echo "Checking for pending database migrations..."
if [ -f "init_migrations.py" ]; then
    echo "Using init_migrations.py for migration setup..."
    export FLASK_APP=init_migrations.py
    python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing startup"
else
    echo "init_migrations.py not found, trying standard migration approach..."
    export FLASK_APP=app.py
    python -m flask db upgrade || echo "Warning: Database migrations failed, but continuing startup"
fi

# Set up environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Determine port - default to 10000 if PORT env var is not set
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Start the application with gunicorn
echo "Starting Gunicorn server..."

# Determine the right app to serve
if [ -f "app.py" ]; then
    # Check which app function exists
    echo "Checking for the create_app function in app.py..."
    if grep -q "def create_app" app.py; then
        echo "Using 'app:create_app()' for Gunicorn"
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
        echo "Using 'app:app' for Gunicorn (app already imported)"
        gunicorn \
            --bind 0.0.0.0:$PORT \
            'app:app' \
            --worker-class eventlet \
            --workers 4 \
            --threads 2 \
            --timeout 120 \
            --access-logfile - \
            --error-logfile - \
            --log-level info
    fi
else
    echo "ERROR: app.py not found!"
    echo "Checking for alternative app files..."
    
    if [ -f "application.py" ]; then
        echo "Found application.py, using instead..."
        gunicorn \
            --bind 0.0.0.0:$PORT \
            'application:app' \
            --worker-class eventlet \
            --workers 4 \
            --threads 2 \
            --timeout 120 \
            --access-logfile - \
            --error-logfile - \
            --log-level info
    else
        echo "No app file found. Cannot start server."
        exit 1
    fi
fi 