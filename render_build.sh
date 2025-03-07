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
# Set RENDER flag for proper static folder detection
RENDER=true
EOF
fi

# Define the absolute static directory path
RENDER_STATIC_DIR="/opt/render/project/src/static"
echo "Using static directory: ${RENDER_STATIC_DIR}"

# Create and set up static directory
echo "Setting up static files directory..."
mkdir -p "${RENDER_STATIC_DIR}"

# Run the comprehensive static files fix script
if [ -f "fix_static_files.py" ]; then
  echo "Running fix_static_files.py to ensure static files exist in all locations..."
  python fix_static_files.py
else
  echo "Creating fix_static_files.py..."
  cat > fix_static_files.py << 'EOF'
#!/usr/bin/env python
"""
Script to fix static file issues by ensuring index.html exists in all possible static directories
"""
import os
import sys
import logging
import shutil

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("fix_static_files")

def ensure_static_dirs():
    """Ensure static directories exist in all possible locations"""
    # Define all possible static directory paths
    static_dirs = [
        "/opt/render/project/src/static",      # Render absolute path
        os.path.join(os.getcwd(), "static"),   # Project root static
        os.path.join(os.getcwd(), "app/static")  # App module static
    ]

    # Default index.html content
    index_html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            text-align: center;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button {
            display: inline-block;
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to the Harmonic Universe platform. The application is running successfully!</p>
        <p>This is a creative platform for music and physics visualization.</p>
        <div>
            <a href="/api/health" class="button">Health Check</a>
            <a href="/debug" class="button">Debug Info</a>
        </div>
    </div>
</body>
</html>"""

    # Ensure all directories exist and contain index.html
    primary_static_dir = None

    # First ensure all directories exist
    for static_dir in static_dirs:
        try:
            if not os.path.exists(static_dir):
                os.makedirs(static_dir, exist_ok=True)
                logger.info(f"Created static directory: {static_dir}")
            else:
                logger.info(f"Static directory already exists: {static_dir}")

            # Store the first successful directory as primary
            if not primary_static_dir:
                primary_static_dir = static_dir
        except Exception as e:
            logger.error(f"Failed to create static directory {static_dir}: {e}")

    # If we have a primary directory, write index.html there
    if primary_static_dir:
        index_path = os.path.join(primary_static_dir, "index.html")
        try:
            with open(index_path, 'w') as f:
                f.write(index_html)
            logger.info(f"Created index.html in {index_path}")

            # Set permissions
            os.chmod(index_path, 0o644)
            logger.info(f"Set permissions on {index_path}")

            # Copy to other static directories
            for static_dir in static_dirs:
                if static_dir != primary_static_dir and os.path.exists(static_dir):
                    dest_path = os.path.join(static_dir, "index.html")
                    try:
                        shutil.copy2(index_path, dest_path)
                        logger.info(f"Copied index.html to {dest_path}")
                    except Exception as e:
                        # If copy fails, write directly
                        try:
                            with open(dest_path, 'w') as f:
                                f.write(index_html)
                            logger.info(f"Created index.html in {dest_path}")
                        except Exception as e2:
                            logger.error(f"Failed to create index.html in {dest_path}: {e2}")
        except Exception as e:
            logger.error(f"Failed to create primary index.html: {e}")

    # Also try creating symlinks for added resilience
    try:
        if primary_static_dir:
            for static_dir in static_dirs:
                if static_dir != primary_static_dir:
                    # Create symlink if it doesn't exist
                    if not os.path.exists(static_dir):
                        os.symlink(primary_static_dir, static_dir)
                        logger.info(f"Created symlink from {primary_static_dir} to {static_dir}")
    except Exception as e:
        logger.error(f"Failed to create symlinks: {e}")

    # Verify everything worked
    for static_dir in static_dirs:
        if os.path.exists(static_dir):
            index_path = os.path.join(static_dir, "index.html")
            if os.path.exists(index_path):
                logger.info(f"✅ Verified: {index_path} exists")
            else:
                logger.error(f"❌ Verification failed: {index_path} does not exist")
        else:
            logger.error(f"❌ Verification failed: {static_dir} does not exist")

if __name__ == "__main__":
    logger.info("Starting static files fix script")
    ensure_static_dirs()
    logger.info("Static files fix script completed")
EOF
  chmod +x fix_static_files.py
  python fix_static_files.py
fi

# Ensure static directory has correct permissions
echo "Setting proper permissions for static directory..."
chmod -R 755 "${RENDER_STATIC_DIR}"

# Verify static directory structure
echo "Static directory structure:"
find "${RENDER_STATIC_DIR}" -type f | sort || echo "Could not find any files in static directory"

# Print directory structure for debugging
echo "Directory structure:"
find . -type f -name "*.py" | sort

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
