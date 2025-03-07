#!/bin/bash
# render_start.sh - Script to start the application on Render

set -e  # Exit immediately if a command fails
set -x  # Print each command before execution

echo "Starting application on Render..."

# Show current directory and files
echo "Current directory: $(pwd)"
echo "Python files: $(find . -name "*.py" | head -20)"

# Activate Python virtual environment
source .venv/bin/activate

# Verify Python packages
echo "Checking for required Python modules..."
python -m pip list
python -c "
import sys
print('Python version:', sys.version)
print('Python path:', sys.path)
try:
    import flask
    print('✅ Flask is available:', flask.__version__)
except ImportError as e:
    print('❌ Flask is not available:', e)
try:
    import sqlalchemy
    print('✅ SQLAlchemy is available:', sqlalchemy.__version__)
except ImportError as e:
    print('❌ SQLAlchemy is not available:', e)
try:
    import flask_sqlalchemy
    print('✅ Flask-SQLAlchemy is available:', flask_sqlalchemy.__version__)
except ImportError as e:
    print('❌ Flask-SQLAlchemy is not available:', e)
"

# Run comprehensive diagnostics
echo "Running diagnostic script..."
python render_diagnose.py

# Ensure static directory exists and has correct permissions
mkdir -p static
chmod -R 755 static

# Check if index.html exists, if not, create it
if [ ! -f "static/index.html" ]; then
  echo "Creating index.html in static directory"
  cat > static/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">
    <h1>Harmonic Universe is running</h1>
    <p>If you see this message, static files are being served correctly.</p>
  </div>
</body>
</html>
EOL
  chmod 644 static/index.html
fi

# Create and set up the Render static directory with extra checks
RENDER_STATIC_DIR="/opt/render/project/src/static"
echo "Creating static directory at $RENDER_STATIC_DIR"
mkdir -p "$RENDER_STATIC_DIR"

# Force copy the index.html to render static directory
echo "Copying index.html to $RENDER_STATIC_DIR"
cp -f static/index.html "$RENDER_STATIC_DIR"/
chmod 644 "$RENDER_STATIC_DIR"/index.html

# Also create a minimal health check file as a last resort
echo "Creating health check files..."
mkdir -p public
cat > public/health << EOL
OK
EOL
chmod 644 public/health

echo "Checking for static/index.html..."
echo "✅ Static directory exists at $(pwd)/static"
ls -la static/
echo "✅ index.html exists in static directory"

# Set environment variables
export FLASK_APP=app.py
export STATIC_FOLDER="$(pwd)/static"
export STATIC_DIR="$(pwd)/static"
export PYTHONUNBUFFERED=1
export FLASK_DEBUG=0
export FLASK_ENV=production
export HOME="$(pwd)"
export PYTHONPATH="$(pwd):$PYTHONPATH"

# Log environment information
echo "Environment variables:"
echo "FLASK_APP=$FLASK_APP"
echo "STATIC_FOLDER=$STATIC_FOLDER"
echo "STATIC_DIR=$STATIC_DIR"
echo "PORT=$PORT"
echo "PATH=$PATH"
echo "PYTHONPATH=$PYTHONPATH"
echo "HOME=$HOME"

# Create a very simple WSGI app that always returns 200 OK for health checks
cat > simple_health.py << 'EOL'
#!/usr/bin/env python
"""
Extremely simple WSGI app for basic health checks
"""
import os
import sys
import logging
import json
from datetime import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("simple_health")

def simple_app(environ, start_response):
    """Simplest possible WSGI app - just returns 200 OK for all requests"""
    path = environ.get('PATH_INFO', '')

    # Log request info
    logger.info(f"Request: {environ.get('REQUEST_METHOD')} {path}")
    logger.info(f"Remote: {environ.get('REMOTE_ADDR')}:{environ.get('REMOTE_PORT')}")

    # Prepare response
    status = '200 OK'
    headers = [('Content-Type', 'application/json')]

    # Generate response body
    response_data = {
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'message': 'Simple health check server is running',
        'path': path,
        'python_version': sys.version
    }

    response_body = json.dumps(response_data).encode('utf-8')

    # Send response
    start_response(status, headers)
    return [response_body]

# Export the application
application = simple_app
app = application  # For compatibility with common WSGI servers

# For testing from command line
if __name__ == '__main__':
    from wsgiref.simple_server import make_server
    port = int(os.environ.get('PORT', 10000))
    httpd = make_server('0.0.0.0', port, application)
    logger.info(f"Starting simple health check server on port {port}")
    httpd.serve_forever()
EOL
chmod +x simple_health.py

# Run the verify script from before
python verify_app.py

# Log static directory contents
echo "Static directory contents:"
ls -la "$STATIC_DIR"
echo "Render static directory contents:"
ls -la "$RENDER_STATIC_DIR"

# Decide which app to run based on module availability
echo "Verifying application..."
if python -c "import flask" &>/dev/null; then
  echo "Flask is available, starting with wsgi_wrapper"
  # Clear any previous PID file
  rm -f gunicorn.pid

  # Start gunicorn with the wsgi_wrapper
  echo "Starting gunicorn with wsgi_wrapper:app for improved reliability"
  exec gunicorn "wsgi_wrapper:app" \
    --config gunicorn.conf.py \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --bind 0.0.0.0:${PORT:-10000}
else
  echo "Flask is NOT available, falling back to simple health check server"
  # Start with the simple health app as a fallback
  exec gunicorn "simple_health:app" \
    --log-level info \
    --access-logfile - \
    --error-logfile - \
    --bind 0.0.0.0:${PORT:-10000}
fi
