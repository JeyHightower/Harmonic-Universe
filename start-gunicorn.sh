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

# Create simplified wrapper to ensure it exists
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
    from flask import Flask
    app = Flask(__name__)

    @app.route('/')
    def error():
        return {"error": "Application failed to initialize properly"}

    logger.info("Created error app")

# Try different import strategies
try:
    # First try explicit import from app
    from app import create_app
    app = create_app()
    logger.info("Successfully created app from app.create_app()")
except Exception as e:
    logger.error(f"Error importing from app: {e}")
    try:
        # Try direct import from wsgi
        from wsgi import app
        logger.info("Successfully imported app from wsgi.py")
    except Exception as e:
        logger.error(f"Error importing from wsgi: {e}")
        try:
            # Try from wsgi_app
            from wsgi_app import application as app
            logger.info("Successfully imported application from wsgi_app")
        except Exception as e:
            logger.error(f"Error importing from wsgi_app: {e}")
            # Create minimal app as last resort
            try:
                from flask import Flask
                app = Flask(__name__)

                @app.route('/')
                def home():
                    return {"status": "error", "message": "Application failed to initialize properly"}

                @app.route('/api/health')
                def health():
                    return {"status": "unhealthy", "message": "Emergency fallback app"}

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
