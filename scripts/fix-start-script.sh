#!/bin/bash
set -e

echo "===== FIXING START.SH SCRIPT ====="
echo "Date: $(date)"

# Determine the correct WSGI application path
if [ -f "app.py" ]; then
  # If app.py exists in the root directory
  export FLASK_APP_PATH="app:app"
  echo "Found app.py in root directory"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  # If app is a package with __init__.py
  export FLASK_APP_PATH="app:app"
  echo "Found app package with __init__.py"
else
  # Search for the app.py or wsgi.py
  APP_FILE=$(find . -maxdepth 2 -name "app.py" -o -name "wsgi.py" | head -1)
  if [ -n "$APP_FILE" ]; then
    APP_FILE=$(basename "$APP_FILE" .py)
    export FLASK_APP_PATH="$APP_FILE:app"
    echo "Found Flask application in $APP_FILE.py"
  else
    echo "ERROR: Could not find app.py or wsgi.py"
    export FLASK_APP_PATH="app:app"  # Default fallback
    echo "Using default fallback: app:app"
  fi
fi

echo "Using WSGI application path: $FLASK_APP_PATH"

# Backup the old start.sh if it exists
if [ -f "start.sh" ]; then
  echo "Backing up existing start.sh to start.sh.backup"
  cp start.sh start.sh.backup
fi

# Create a clean start.sh file
echo "Creating a clean start.sh file..."
cat > start.sh << EOF
#!/bin/bash
# Flask application startup script for Harmonic Universe

# Diagnostic information
echo "===== FLASK APP DIAGNOSTICS ====="
if [ -f "app.py" ]; then
  echo "Found app.py in root directory"
  echo "First 10 lines of app.py:"
  head -n 10 app.py
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found Flask app package with __init__.py"
  echo "First 10 lines of app/__init__.py:"
  head -n 10 app/__init__.py
else
  echo "WARNING: Standard Flask app structure not found"
  echo "Searching for Python files:"
  find . -maxdepth 2 -name "*.py" | grep -v "__pycache__"
fi

# Get the PORT from environment or use default
PORT=\${PORT:-5000}
echo "Starting server on port \$PORT..."

# Start gunicorn server
gunicorn $FLASK_APP_PATH --bind 0.0.0.0:\$PORT --log-level info
EOF

# Make start.sh executable
chmod +x start.sh

echo "===== START.SH FIXED SUCCESSFULLY ====="
echo "New start.sh contents:"
cat start.sh
echo
echo "You can test this with: ./start.sh"
