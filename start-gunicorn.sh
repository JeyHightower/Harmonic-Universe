#!/bin/bash
set -e

echo "=== Starting Gunicorn for Harmonic Universe ==="
echo "Date: $(date)"
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Check for virtual environment
VENV_PATH="/opt/render/project/src/.venv"
VENV_ACTIVE=0

if [ -d "$VENV_PATH" ]; then
    echo "Virtual environment detected at $VENV_PATH"
    echo "Activating virtual environment..."
    source "$VENV_PATH/bin/activate"
    VENV_ACTIVE=1
    echo "Using Python: $(which python)"
    echo "Using pip: $(which pip)"
else
    echo "No virtual environment found at $VENV_PATH"
fi

# Ensure static directory exists and has content at project root level
echo "=== Checking project root static directory ==="
STATIC_ROOT="$(pwd)/static"
mkdir -p $STATIC_ROOT
mkdir -p $STATIC_ROOT/assets

echo "Static root directory: $STATIC_ROOT"
echo "Static root directory exists: $([ -d "$STATIC_ROOT" ] && echo 'Yes' || echo 'No')"
echo "Static root directory permissions:"
ls -la "$STATIC_ROOT"

# Ensure app module static directory exists (this might be where Flask looks)
echo "=== Checking app module static directory ==="
APP_STATIC="$(pwd)/app/static"
mkdir -p $APP_STATIC
echo "App static directory: $APP_STATIC"
echo "App static directory exists: $([ -d "$APP_STATIC" ] && echo 'Yes' || echo 'No')"
echo "App static directory permissions:"
ls -la "$APP_STATIC"

# Verify if static files exist, create minimal versions if not
if [ ! -f "$STATIC_ROOT/index.html" ]; then
    echo "Creating minimal index.html in static directory"
    cat > $STATIC_ROOT/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running! This is a fallback page created by start-gunicorn.sh.</p>
        <div id="api-status">Checking API status...</div>
        <div id="debug-info">
            <p>Generated at: $(date)</p>
            <p>Server: $(hostname)</p>
            <p>Static Root: $STATIC_ROOT</p>
            <p>App Static: $APP_STATIC</p>
        </div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>
EOF

    # Also copy to app/static to ensure it's available in both locations
    cp $STATIC_ROOT/index.html $APP_STATIC/index.html
fi

# Create debug script if it doesn't exist
if [ ! -f "$STATIC_ROOT/debug.js" ]; then
    echo "Creating debug.js in static directory"
    cat > $STATIC_ROOT/debug.js << EOF
// Debug file to verify static asset serving
console.log('Debug script loaded successfully!');

// Create a visible indicator on the page
document.addEventListener('DOMContentLoaded', function() {
  const debugElement = document.createElement('div');
  debugElement.style.position = 'fixed';
  debugElement.style.bottom = '10px';
  debugElement.style.right = '10px';
  debugElement.style.padding = '10px';
  debugElement.style.background = 'green';
  debugElement.style.color = 'white';
  debugElement.style.borderRadius = '5px';
  debugElement.style.zIndex = '9999';
  debugElement.textContent = 'Debug: Static files working!';
  document.body.appendChild(debugElement);
});
EOF

    # Copy to app/static as well
    cp $STATIC_ROOT/debug.js $APP_STATIC/debug.js
fi

# Create version-patch.js
if [ ! -f "$STATIC_ROOT/version-patch.js" ]; then
    echo "Creating version-patch.js in static directory"
    cat > $STATIC_ROOT/version-patch.js << EOF
// Simple version patch script
console.log('Version patch script loaded');

// Define any required globals to prevent errors
window.__ENV__ = window.__ENV__ || {};
window.__ENV__.API_URL = window.location.origin;
window.__VERSION__ = '1.0.0';
EOF

    # Copy to app/static as well
    cp $STATIC_ROOT/version-patch.js $APP_STATIC/version-patch.js
fi

# Set permissions for both static directories
echo "Setting permissions for static directories"
chmod -R 755 $STATIC_ROOT
chmod -R 755 $APP_STATIC

echo "Final static directory contents (project root):"
ls -la $STATIC_ROOT
echo "Final static directory contents (app module):"
ls -la $APP_STATIC

# Force reinstall of critical dependencies
echo "=== Installing critical dependencies ==="
python -m pip install --upgrade pip
python -m pip install --no-cache-dir Flask==2.0.1
python -m pip install --no-cache-dir psycopg2-binary==2.9.9
python -m pip install --no-cache-dir gunicorn==20.1.0

# Install all requirements
echo "=== Installing all requirements ==="
python -m pip install --no-cache-dir -r requirements.txt

# List installed packages
echo "=== Installed packages ==="
python -m pip list

# Verify dependencies are accessible from Python
echo "=== Verifying dependencies ==="
python -c "import sys; print('Python version:', sys.version); print('Python path:', sys.path)"
python -c "import flask; print('Flask version:', flask.__version__)" || echo "Failed to import Flask"
python -c "import psycopg2; print('Psycopg2 version:', psycopg2.__version__)" || echo "Failed to import psycopg2"

# Create simplified wsgi_wrapper.py that uses correct static path
echo "Creating simplified wsgi_wrapper.py..."
cat > wsgi_wrapper.py << 'EOF'
#!/usr/bin/env python
import os
import sys
import logging
import datetime

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi_wrapper")

logger.info("Starting wsgi_wrapper.py")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Verify dependencies
try:
    import flask
    logger.info(f"Found Flask: {flask.__version__}")
    import psycopg2
    logger.info(f"Found psycopg2: {psycopg2.__version__}")
except ImportError as e:
    logger.error(f"Missing dependency: {e}")
    raise ImportError(f"Critical dependency missing: {e}")

# Check both possible static directories
static_dirs = [
    os.path.join(current_dir, 'static'),  # Project root static
    os.path.join(current_dir, 'app', 'static')  # App module static
]

for static_dir in static_dirs:
    logger.info(f"Checking static directory at {static_dir}")
    if os.path.exists(static_dir):
        logger.info(f"Static directory exists at {static_dir}")
        try:
            files = os.listdir(static_dir)
            logger.info(f"Static directory contents: {files}")
        except Exception as e:
            logger.error(f"Unable to list static directory contents: {e}")
    else:
        logger.warning(f"Static directory does not exist at {static_dir}")

# Use the project root static directory for our app
static_dir = os.path.join(current_dir, 'static')

# Ensure the directory exists
if not os.path.exists(static_dir):
    try:
        os.makedirs(static_dir, exist_ok=True)
        logger.info(f"Created static directory at {static_dir}")
    except Exception as e:
        logger.error(f"Failed to create static directory: {e}")

# Try to import the Flask app with our static folder
try:
    # First patch Flask to use our static folder
    def patch_flask():
        flask_init_original = flask.Flask.__init__

        def flask_init_patched(self, import_name, static_url_path=None, static_folder=None, *args, **kwargs):
            logger.info(f"Patching Flask.__init__ to use static_folder={static_dir}")
            return flask_init_original(self, import_name, static_url_path=static_url_path, static_folder=static_dir, *args, **kwargs)

        flask.Flask.__init__ = flask_init_patched
        return flask_init_original

    # Apply the patch
    original_init = patch_flask()

    # Now import the app
    from app import create_app
    app = create_app()

    # Restore the original Flask init
    flask.Flask.__init__ = original_init

    logger.info(f"Successfully created app with static_folder: {app.static_folder}")
except Exception as e:
    logger.error(f"Error importing from app: {e}")

    # Create fallback Flask app
    app = flask.Flask(__name__, static_folder=static_dir)
    logger.info(f"Created fallback Flask app with static_folder: {app.static_folder}")

    @app.route('/')
    def home():
        logger.info("Serving fallback index.html")
        return flask.send_from_directory(app.static_folder, 'index.html')

    @app.route('/api/health')
    def health():
        return flask.jsonify({"status": "unhealthy", "message": "Emergency fallback app"})

    @app.route('/<path:path>')
    def static_files(path):
        logger.info(f"Serving static file: {path}")
        if os.path.exists(os.path.join(app.static_folder, path)):
            return flask.send_from_directory(app.static_folder, path)
        else:
            logger.warning(f"File not found: {path}")
            return f"File not found: {path}", 404

# Additional verification
logger.info(f"Final app static_folder: {app.static_folder}")
logger.info(f"App static_folder exists: {os.path.exists(app.static_folder)}")
if hasattr(app, 'static_folder') and os.path.exists(app.static_folder):
    try:
        files = os.listdir(app.static_folder)
        logger.info(f"App static_folder contents: {files}")

        index_path = os.path.join(app.static_folder, 'index.html')
        if os.path.exists(index_path):
            logger.info(f"index.html exists in app.static_folder")
        else:
            logger.warning(f"index.html does not exist in app.static_folder")
    except Exception as e:
        logger.error(f"Error checking app.static_folder: {e}")
else:
    logger.warning(f"App static_folder doesn't exist: {app.static_folder}")

# This is the WSGI entry point that gunicorn will use
EOF

chmod +x wsgi_wrapper.py

# Set Python path to include all possible locations
export PYTHONPATH=$PYTHONPATH:$(pwd):/opt/render/project/src

# Print debug information
echo "Current environment:"
echo "PYTHONPATH: $PYTHONPATH"
echo "PATH: $PATH"

# Ensure wsgi_wrapper.py exists
if [ ! -f "wsgi_wrapper.py" ]; then
    echo "ERROR: wsgi_wrapper.py not found"
    exit 1
fi

# Start Gunicorn with our wrapper
echo "=== Starting Gunicorn with wsgi_wrapper:app ==="
if [ $VENV_ACTIVE -eq 1 ]; then
    # Use the virtual environment's gunicorn
    gunicorn wsgi_wrapper:app --log-level debug --workers 1 --timeout 120
else
    # Fallback to python -m gunicorn
    python -m gunicorn wsgi_wrapper:app --log-level debug --workers 1 --timeout 120
fi
