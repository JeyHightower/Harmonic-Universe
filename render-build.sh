#!/bin/bash
set -e

echo "=== Starting Render Build Process ==="
echo "Date: $(date)"
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"
echo "Python executable: $(which python)"

# Set environment variables for PostgreSQL
export PGCONNECT_TIMEOUT=10
export PGSSLMODE=require

# Install system dependencies - PostgreSQL client libraries
echo "Installing system dependencies..."
apt-get update -qq
DEBIAN_FRONTEND=noninteractive apt-get install -y --no-install-recommends \
    libpq-dev \
    postgresql-client \
    build-essential \
    python3-dev \
    netcat \
    curl \
    python3-venv

# Clean up apt cache to reduce image size
apt-get clean
rm -rf /var/lib/apt/lists/*

# Check for virtual environment and activate it if exists
VENV_PATH="/opt/render/project/src/.venv"
if [ -d "$VENV_PATH" ]; then
    echo "Virtual environment detected at $VENV_PATH"
    echo "Activating virtual environment..."
    source "$VENV_PATH/bin/activate"
    echo "Using Python: $(which python)"
    echo "Using pip: $(which pip)"
else
    echo "No virtual environment found at $VENV_PATH - creating one"
    python -m venv .venv
    source .venv/bin/activate
    echo "Created and activated new virtual environment"
    echo "Using Python: $(which python)"
    echo "Using pip: $(which pip)"
fi

# Ensure pip is up to date
echo "Upgrading pip in virtual environment..."
python -m pip install --upgrade pip

# Install critical dependencies first
echo "Installing critical dependencies..."
python -m pip install --no-cache-dir Flask==2.0.1
python -m pip install --no-cache-dir Werkzeug==2.0.1
python -m pip install --no-cache-dir psycopg2-binary==2.9.9
python -m pip install --no-cache-dir gunicorn==20.1.0

# Verify gunicorn is installed and in PATH
if which gunicorn > /dev/null; then
    echo "Gunicorn is installed and in PATH: $(which gunicorn)"
    gunicorn --version
else
    echo "WARNING: Gunicorn not found in PATH after installation"
    echo "Attempting alternative installation..."
    python -m pip install --no-cache-dir gunicorn==20.1.0
    python -m gunicorn --version || echo "Failed to run gunicorn even after reinstall"
fi

# Install remaining Python dependencies
echo "Installing remaining dependencies..."
python -m pip install --no-cache-dir -r requirements.txt

# Verify critical packages
echo "Verifying critical packages..."
python -c "import flask; print('Flask version:', flask.__version__)" || echo "Error: Flask import failed"
python -c "import psycopg2; print('Psycopg2 version:', psycopg2.__version__)" || echo "Error: Psycopg2 import failed"
python -c "import sys; print('Python path:', sys.path)" || echo "Error: Cannot print Python path"

# List installed packages for debugging
echo "Installed packages:"
python -m pip list

# Create a marker file to indicate successful dependency installation
echo "Creating dependency marker file..."
echo "Dependencies installed on $(date)" > .deps_installed

# Make db_connect.sh executable if it exists
if [ -f "db_connect.sh" ]; then
    chmod +x db_connect.sh
    echo "Testing database connection with db_connect.sh..."
    # Run but don't fail the build if it fails
    ./db_connect.sh || echo "Database connection test failed, but continuing build"
else
    echo "Creating emergency database connection test..."
    cat > db_test.py << EOF
#!/usr/bin/env python
import os
import sys
import time

def test_connection():
    url = os.environ.get('DATABASE_URL')
    if not url:
        print("No DATABASE_URL environment variable found")
        return False

    for adapter in ['psycopg2', 'pg8000', 'psycopg']:
        try:
            print(f"Trying {adapter}...")
            if adapter == 'psycopg2':
                import psycopg2
                conn = psycopg2.connect(url)
            elif adapter == 'pg8000':
                import pg8000.native
                conn = pg8000.native.Connection(url)
            elif adapter == 'psycopg':
                import psycopg
                conn = psycopg.connect(url)

            cursor = conn.cursor()
            cursor.execute('SELECT 1')
            print(f"{adapter} connection successful!")
            conn.close()
            return True
        except Exception as e:
            print(f"{adapter} connection error: {e}")

    return False

# Retry logic
retries = 3
for i in range(retries):
    print(f"Connection attempt {i+1}/{retries}")
    if test_connection():
        sys.exit(0)
    if i < retries - 1:
        print(f"Retrying in 5 seconds...")
        time.sleep(5)

print("All connection attempts failed")
# Don't fail the build
sys.exit(0)
EOF
    chmod +x db_test.py
    python db_test.py
fi

# Ensure static directory exists
mkdir -p static

# Check if static files already exist
if [ -f "static/index.html" ]; then
    echo "Static files already exist, preserving them"
else
    echo "Static files missing, creating emergency content"
    # Create emergency index file
    cat > static/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Deployment successful! This is the emergency page.</p>
    </div>
</body>
</html>
EOF
fi

# Create a test file
echo "Creating test files..."
echo "<html><body><h1>Test Page</h1><p>If you can see this, static file serving is working.</p></body></html>" > static/test.html

# Set proper permissions
chmod -R 755 static

# List files
echo "=== Static Files ==="
ls -la static/

echo "=== Build Complete ==="
