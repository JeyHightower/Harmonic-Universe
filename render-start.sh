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
    echo "Attempting fallback with minimal config..."

    # Try with minimal worker class settings
    $GUNICORN_CMD --config=gunicorn.conf.py --worker-class=sync $MODULE_NAME || {
        echo "Error: Fallback to sync worker class failed"
        echo "Attempting direct run with minimal settings..."

        # Final fallback - direct run with inline settings
        $GUNICORN_CMD --workers=1 --timeout=120 --bind="0.0.0.0:${PORT:-10000}" app.wsgi:application
    }
}
