#!/bin/bash
set -e

echo "=== Starting Gunicorn for Harmonic Universe ==="
echo "Date: $(date)"
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

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

echo "Directory contents:"
ls -la

# Ensure static directory exists and has content
echo "=== Checking static directory ==="
mkdir -p static
mkdir -p static/assets

# Verify if static files exist, create minimal versions if not
if [ ! -f "static/index.html" ]; then
    echo "Creating minimal index.html in static directory"
    cat > static/index.html << EOF
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
fi

# Create debug script if it doesn't exist
if [ ! -f "static/debug.js" ]; then
    echo "Creating debug.js in static directory"
    cat > static/debug.js << EOF
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
fi

# Set permissions
echo "Setting permissions for static directory"
chmod -R 755 static

echo "Static directory contents:"
ls -la static

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

# Create debug static content as fallback
static_dir = os.path.join(current_dir, 'static')
logger.info(f"Checking static directory at {static_dir}")
if os.path.exists(static_dir):
    logger.info(f"Static directory exists at {static_dir}")
    logger.info(f"Static directory contents: {os.listdir(static_dir)}")
else:
    logger.warning(f"Static directory does not exist at {static_dir}")

# Try different import strategies
try:
    # First try explicit import from app
    from app import create_app
    app = create_app()
    logger.info("Successfully created app from app.create_app()")
except Exception as e:
    logger.error(f"Error importing from app: {e}")
    # Create minimal app as last resort
    try:
        from flask import Flask, send_from_directory

        app = Flask(__name__, static_folder='static')
        logger.info(f"Created fallback Flask app with static_folder: {app.static_folder}")

        @app.route('/')
        def home():
            try:
                logger.info("Serving fallback index.html")
                static_path = app.static_folder
                if os.path.exists(os.path.join(static_path, 'index.html')):
                    logger.info(f"index.html exists at {os.path.join(static_path, 'index.html')}")
                    return send_from_directory(static_path, 'index.html')
                else:
                    logger.error(f"index.html not found in {static_path}")
                    return "Index.html not found", 404
            except Exception as e:
                logger.error(f"Error serving index.html: {e}")
                return f"Error: {str(e)}", 500

        @app.route('/api/health')
        def health():
            from flask import jsonify
            return jsonify({"status": "unhealthy", "message": "Emergency fallback app"})

        @app.route('/<path:path>')
        def static_files(path):
            logger.info(f"Serving static file: {path}")
            return send_from_directory(app.static_folder, path)

        logger.info("Created fallback app")
    except Exception as e:
        logger.error(f"Failed to create even a fallback app: {e}")
        raise RuntimeError("Could not initialize any Flask application")
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
