#!/usr/bin/env bash
# Strict error handling
set -eo pipefail

echo "=== RUNNING RENDER BUILD SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Install dependencies
echo "Installing Python dependencies..."
pip install gunicorn==21.2.0 flask-migrate
pip install -r requirements.txt

# Ensure the app directory exists
echo "Setting up application structure..."
mkdir -p app

# List Python path
echo "Python path:"
python -c "import sys; print(sys.path)"

# Verify app/__init__.py exists
if [ ! -f "app/__init__.py" ]; then
  echo "Creating app/__init__.py"
  cat > app/__init__.py << 'EOF'
# app/__init__.py
"""
Package initialization for the app module.
This file ensures the app directory is treated as a proper Python package.
"""
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)
logger.info("Initializing app package")
EOF
fi

# Print directory structure for debugging
echo "Directory structure:"
find . -type f -name "*.py" | sort

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
