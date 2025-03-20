#!/bin/bash
# Helper script for starting the app on Render.com

set -o errexit
set -o nounset
set -o pipefail

echo "=== Starting Render deployment script ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Source gunicorn_path.sh if it exists (for OpenBSD's Python)
if [ -f "gunicorn_path.sh" ]; then
    echo "Sourcing gunicorn_path.sh"
    source gunicorn_path.sh
fi

# Try to find gunicorn in various locations
if command -v gunicorn &>/dev/null; then
    GUNICORN_CMD="gunicorn"
elif command -v python3 -m gunicorn &>/dev/null; then
    GUNICORN_CMD="python3 -m gunicorn"
elif command -v python -m gunicorn &>/dev/null; then
    GUNICORN_CMD="python -m gunicorn"
else
    # Last resort, try to find it in a venv/bin directory or similar
    for path in venv/bin/gunicorn .venv/bin/gunicorn env/bin/gunicorn; do
        if [ -x "$path" ]; then
            GUNICORN_CMD="$path"
            break
        fi
    done
fi

# Run pre-start verification script if it exists
if [ -f "prerun.sh" ]; then
    echo "Running pre-start verification script..."
    bash prerun.sh
fi

# Final check for gunicorn
if [ -z "${GUNICORN_CMD:-}" ]; then
    echo "Error: gunicorn not found"
    echo "Trying to install gunicorn..."
    pip install gunicorn
    GUNICORN_CMD="gunicorn"
fi

echo "Using gunicorn command: $GUNICORN_CMD"

# Check for wsgi modules
for wsgi_module in "app.wsgi:application" "wsgi:application" "app:app" "app:application"; do
    # Use python to check if the module exists
    if python -c "import sys, importlib.util; module_name = '${wsgi_module%%:*}'; spec = importlib.util.find_spec(module_name); sys.exit(0 if spec else 1)" 2>/dev/null; then
        echo "Found WSGI module: $wsgi_module"
        MODULE_EXISTS=1
        MODULE_NAME="$wsgi_module"
        break
    fi
done

if [ -z "${MODULE_EXISTS:-}" ]; then
    echo "Error: Could not find a valid WSGI module"
    echo "Falling back to app.wsgi:application"
    MODULE_NAME="app.wsgi:application"
fi

# Set static folder environment variable for the app
export STATIC_DIR="/opt/render/project/src/static"

# Start the application with Gunicorn
echo "Starting gunicorn with module: $MODULE_NAME"

# Create a minimal gunicorn.conf.py if it doesn't exist
if [ ! -f "gunicorn.conf.py" ]; then
    echo "Creating minimal gunicorn.conf.py..."
    cat > gunicorn.conf.py << 'EOF'
#!/usr/bin/env python
"""
Minimal Gunicorn configuration to ensure the app starts even if the original config fails
"""
import os
import logging

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("gunicorn.conf")

bind = f"0.0.0.0:{os.environ.get('PORT', '10000')}"
workers = 1
timeout = 120
EOF
    chmod +x gunicorn.conf.py
fi

# Try to run gunicorn with our config
echo "Command: $GUNICORN_CMD --config=gunicorn.conf.py $MODULE_NAME"
$GUNICORN_CMD --config=gunicorn.conf.py $MODULE_NAME || {
    echo "Error: Gunicorn failed to start with custom config"
    echo "Attempting to run with start_flask.py..."

    # Create start_flask.py if it doesn't exist
    if [ ! -f "start_flask.py" ]; then
        echo "Creating start_flask.py..."
        cat > start_flask.py << 'EOF'
#!/usr/bin/env python
"""
Direct Flask application loader for Render.com deployment.
This script loads and runs the Flask application directly, ensuring it handles
responses properly with content-length headers.
"""
import os
import sys
import logging

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("start_flask")

def find_flask_app():
    """Find and load the Flask application from the app module."""
    logger.info("Searching for Flask application in app module")

    try:
        # Try to import the create_app function
        from app import create_app
        logger.info("Found create_app function in app module")

        # Create the Flask application
        app = create_app()
        logger.info(f"Successfully created Flask app: {app.name}")
        return app
    except ImportError as e:
        logger.error(f"Error importing create_app from app module: {e}")

        # Try alternative approaches
        try:
            # Try to import app directly from app module
            import app as app_module

            # Check if the module has an app attribute
            if hasattr(app_module, 'app'):
                logger.info("Found app attribute in app module")
                return app_module.app

            # Check if the module has an application attribute
            if hasattr(app_module, 'application'):
                logger.info("Found application attribute in app module")
                return app_module.application

            # If the module has a create_app function, call it
            if hasattr(app_module, 'create_app'):
                logger.info("Found create_app function in app module")
                return app_module.create_app()

            logger.error("Could not find Flask app in app module")
        except Exception as alt_err:
            logger.error(f"Alternative import approach failed: {alt_err}")

    # If we get here, try import from wsgi
    try:
        logger.info("Trying to import Flask app from wsgi module")
        from wsgi import application
        logger.info("Found application in wsgi module")
        return application
    except ImportError:
        try:
            from app.wsgi import application
            logger.info("Found application in app.wsgi module")
            return application
        except ImportError:
            logger.error("Could not import Flask app from wsgi modules")

    logger.error("All approaches to find Flask app failed")
    return None

def patch_flask_app(app):
    """
    Patch the Flask application to ensure proper HTML responses.
    This adds middleware and routes to handle HTML content properly.
    """
    from flask import Flask, Response, request

    if not isinstance(app, Flask):
        logger.error(f"Object is not a Flask application: {type(app)}")
        return False

    logger.info(f"Patching Flask application: {app.name}")

    # Add a response middleware to ensure content-length is always set
    @app.after_request
    def ensure_html_response_headers(response):
        """Ensure HTML responses have proper headers."""
        try:
            if hasattr(response, 'mimetype') and response.mimetype == 'text/html' and hasattr(response, 'data') and response.data:
                # Make sure Content-Length is set
                if 'Content-Length' not in response.headers:
                    response.headers['Content-Length'] = str(len(response.data))
                    logger.info(f"Added Content-Length header: {len(response.data)}")

                # Make sure Content-Type includes charset
                if 'Content-Type' in response.headers and 'charset' not in response.headers['Content-Type']:
                    response.headers['Content-Type'] = 'text/html; charset=utf-8'
                    logger.info("Fixed Content-Type header to include charset")

            # Log response info
            logger.info(f"Response status: {response.status_code}, content-length: {response.headers.get('Content-Length', 'unknown')}")
            return response
        except Exception as e:
            logger.exception(f"Error in response middleware: {e}")
            return response

    # Add debug request middleware
    @app.before_request
    def log_request_details():
        """Log request details for debugging."""
        logger.info(f"Request: {request.method} {request.path}")
        logger.debug(f"Request headers: {dict(request.headers)}")

    logger.info("Successfully patched Flask application")
    return True

def run_flask_app():
    """Find, patch and run the Flask application."""
    logger.info("Starting Flask application loader")

    # Find the Flask application
    app = find_flask_app()
    if not app:
        logger.error("Failed to find Flask application")
        sys.exit(1)

    # Patch the Flask application
    if not patch_flask_app(app):
        logger.error("Failed to patch Flask application")
        sys.exit(1)

    logger.info("Flask application patched successfully")

    # Set environment variables for Flask
    os.environ['FLASK_APP'] = 'app'
    os.environ['FLASK_ENV'] = 'production'

    # Return the app for wsgi servers
    return app

# This allows the script to be imported by Gunicorn
application = run_flask_app()

if __name__ == "__main__":
    # If running directly, start the development server
    logger.info("Running Flask application in development mode")
    host = os.environ.get('HOST', '0.0.0.0')
    port = int(os.environ.get('PORT', 8000))
    application.run(host=host, port=port, debug=False)
EOF
        chmod +x start_flask.py
    fi

    # Try with our start_flask script
    $GUNICORN_CMD start_flask:application --bind 0.0.0.0:${PORT:-10000} --log-level info || {
        echo "Error: Fallback to start_flask.py failed"
        echo "Attempting direct Flask run with minimal settings..."

        # Final fallback - direct Flask run
        python -c "
import os
from app import create_app
app = create_app()
app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
"
    }
}
