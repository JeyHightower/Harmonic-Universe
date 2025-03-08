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

# Create default index.html if it doesn't exist
if [ ! -f "${RENDER_STATIC_DIR}/index.html" ]; then
  echo "Creating default index.html..."
  cat > "${RENDER_STATIC_DIR}/index.html" << 'EOF'
<!DOCTYPE html>
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
</html>
EOF
fi

# Create a small CSS file for styling
echo "Creating basic styles.css..."
mkdir -p "${RENDER_STATIC_DIR}/css"
cat > "${RENDER_STATIC_DIR}/css/styles.css" << 'EOF'
/* Basic styling */
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    line-height: 1.6;
    color: #333;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 1rem;
}

h1, h2, h3 {
    color: #3a0ca3;
}

a {
    color: #4361ee;
    text-decoration: none;
}

a:hover {
    text-decoration: underline;
}
EOF

# Create assets directory
mkdir -p "${RENDER_STATIC_DIR}/assets"

# Ensure static directory has correct permissions
echo "Setting proper permissions for static directory..."
chmod -R 755 "${RENDER_STATIC_DIR}"

# Verify static directory structure
echo "Static directory structure:"
find "${RENDER_STATIC_DIR}" -type f | sort

# Create additional symbolic links for flexibility
echo "Creating symbolic links for static directory..."
ln -sf "${RENDER_STATIC_DIR}" static
if [ -d "app" ]; then
  ln -sf "${RENDER_STATIC_DIR}" app/static
fi

# Print directory structure for debugging
echo "Directory structure:"
find . -type f -name "*.py" | sort

echo "=== BUILD COMPLETED SUCCESSFULLY ==="
