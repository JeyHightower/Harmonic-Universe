#!/usr/bin/env bash
# Strict error handling
set -eo pipefail

echo "=== RUNNING RENDER BUILD SCRIPT ==="
echo "Current directory: $(pwd)"
echo "Files in current directory:"
ls -la

# Install dependencies
echo "Installing Python dependencies..."
pip install gunicorn==21.2.0 flask-migrate python-dotenv Flask
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

# Check if config.py exists and patch it if needed
if [ -f "config.py" ]; then
  echo "Checking config.py for load_dotenv import..."
  if grep -q "load_dotenv()" config.py && ! grep -q "from dotenv import load_dotenv" config.py; then
    echo "Patching config.py to include load_dotenv import"
    sed -i '1s/^/from dotenv import load_dotenv\n/' config.py || \
    echo 'from dotenv import load_dotenv' | cat - config.py > temp && mv temp config.py
  fi
fi

# Create .env file with basic configuration if it doesn't exist
if [ ! -f ".env" ]; then
  echo "Creating minimal .env file for production"
  cat > .env << 'EOF'
# Production environment variables
FLASK_ENV=production
FLASK_APP=app
DEBUG=False
LOG_LEVEL=INFO
SECRET_KEY=render-auto-generated-key-do-not-use-in-prod
DATABASE_URL=${DATABASE_URL:-sqlite:///app.db}
EOF
fi

# Print directory structure for debugging
echo "Directory structure:"
find . -type f -name "*.py" | sort

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
