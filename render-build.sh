#!/usr/bin/env bash
set -o errexit

echo "=== Running Harmonic Universe Build Script ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Install required dependencies
echo "Installing dependencies..."
pip install gunicorn==21.2.0 flask-migrate
pip install -r requirements.txt

# Create app directory if it doesn't exist
if [ ! -d "app" ]; then
  echo "Creating app directory"
  mkdir -p app
fi

# Create a symbolic link from app/wsgi.py to wsgi.py
# This ensures app.wsgi:application can be found
echo "Setting up WSGI module..."
if [ -f "wsgi.py" ]; then
  echo "Found wsgi.py at root level"

  # Create app/wsgi.py that imports from root wsgi.py
  echo "Creating app/wsgi.py bridge module"
  cat > app/wsgi.py << 'EOF'
#!/usr/bin/env python
"""
Bridge module for Render.com deployment.
This file imports and re-exports the application from the root wsgi.py
"""
import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Loading bridge wsgi.py module for Render.com compatibility")

# Add the parent directory to the Python path to access the root wsgi module
current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Import the application from the root wsgi
try:
    from wsgi import app, application
    logger.info("Successfully imported application from root wsgi.py")
except ImportError as e:
    logger.error(f"Failed to import from root wsgi.py: {e}")
    raise

# Re-export the application
# application = app # This is already done in the root wsgi.py

# For troubleshooting
logger.info(f"Current Python path: {sys.path}")
logger.info(f"Application object: {application}")
EOF

  # Make sure app/__init__.py exists
  if [ ! -f "app/__init__.py" ]; then
    echo "Creating app/__init__.py"
    echo "# Package initialization" > app/__init__.py
  fi

  # Create symbolic links as a fallback (might not work on all systems)
  echo "Attempting to create symbolic links for additional reliability"
  if [ ! -f "app/wsgi_symlink.py" ]; then
    echo "Creating app/wsgi_symlink.py as symbolic link to wsgi.py"
    ln -sf ../wsgi.py app/wsgi_symlink.py || echo "Failed to create symbolic link"
  fi

  # Copy wsgi.py to app/wsgi.py.copy as another fallback
  echo "Creating a direct copy of wsgi.py to app/wsgi.py.copy"
  cp wsgi.py app/wsgi.py.copy || echo "Failed to copy wsgi.py"

  # Create a Python script to repair things at runtime if needed
  cat > fix_wsgi_paths.py << 'EOF'
#!/usr/bin/env python
"""
Runtime fix for WSGI import issues
"""
import os
import sys
import shutil
import importlib
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fix_wsgi_paths")

def fix_wsgi_paths():
    logger.info("Running WSGI path fix")

    # Add current directory to path
    current_dir = os.path.dirname(os.path.abspath(__file__))
    if current_dir not in sys.path:
        sys.path.insert(0, current_dir)
        logger.info(f"Added {current_dir} to sys.path")

    # Create app directory if needed
    app_dir = os.path.join(current_dir, "app")
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)
        logger.info(f"Created {app_dir}")

    # Create __init__.py if needed
    init_path = os.path.join(app_dir, "__init__.py")
    if not os.path.exists(init_path):
        with open(init_path, "w") as f:
            f.write("# Package initialization\n")
        logger.info(f"Created {init_path}")

    # Create app/wsgi.py if it doesn't exist
    wsgi_source = os.path.join(current_dir, "wsgi.py")
    wsgi_dest = os.path.join(app_dir, "wsgi.py")

    if os.path.exists(wsgi_source) and not os.path.exists(wsgi_dest):
        # Create a bridge module
        with open(wsgi_dest, "w") as f:
            f.write("""#!/usr/bin/env python
import os
import sys
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("app.wsgi")
logger.info("Loading runtime-fixed bridge wsgi.py module")

current_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

try:
    from wsgi import app, application
    logger.info("Successfully imported application from root wsgi.py")
except ImportError as e:
    logger.error(f"Failed to import from wsgi.py: {e}")
    raise

logger.info(f"Application object: {application}")
""")
        logger.info(f"Created bridge module at {wsgi_dest}")

if __name__ == "__main__":
    fix_wsgi_paths()
EOF

  # Make the fix script executable
  chmod +x fix_wsgi_paths.py

  # Run the fix script to ensure everything is set up
  echo "Running wsgi path fix script"
  python fix_wsgi_paths.py

else
  echo "ERROR: wsgi.py not found in the root directory"
  echo "Searching for any wsgi files:"
  find . -name "wsgi*.py" -type f
  exit 1
fi

echo "Build completed successfully"
