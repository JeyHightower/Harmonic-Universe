#!/bin/bash
set -e

echo "===== FIXING GUNICORN WSGI CONFIGURATION ====="
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
    exit 1
  fi
fi

echo "Using WSGI application path: $FLASK_APP_PATH"

# Update the gunicorn command in start.sh
if [ -f "start.sh" ]; then
  echo "Updating start.sh script..."
  # Create backup
  cp start.sh start.sh.bak

  # Update the gunicorn command line - handle various formats that might exist
  if grep -q "gunicorn app.py" start.sh; then
    sed -i.bak "s|gunicorn app.py|gunicorn $FLASK_APP_PATH|g" start.sh
  elif grep -q "gunicorn app.wsgi:application" start.sh; then
    sed -i.bak "s|gunicorn app.wsgi:application|gunicorn $FLASK_APP_PATH|g" start.sh
  elif grep -q "gunicorn" start.sh; then
    # More general replacement if specific patterns not found
    sed -i.bak "s|gunicorn [^ ]*|gunicorn $FLASK_APP_PATH|g" start.sh
  else
    # If gunicorn command not found, append it
    echo "Gunicorn command not found in start.sh, adding it..."
    echo "gunicorn $FLASK_APP_PATH --bind 0.0.0.0:\$PORT --log-level info" >> start.sh
  fi

  # Add diagnostic information to start.sh
  if ! grep -q "Checking Flask application structure" start.sh; then
    echo "Adding diagnostic information to start.sh..."
    sed -i.bak '1s/^/# Added Flask application structure diagnostics\n/' start.sh
    sed -i.bak '2i\
echo "Checking Flask application structure:" \
if [ -f "app.py" ]; then \
  echo "Found app.py in root directory" \
  cat app.py | head -10 \
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then \
  echo "Found app package with __init__.py" \
  cat app/__init__.py | head -10 \
else \
  echo "WARNING: Could not find expected Flask application file" \
  find . -name "*.py" | grep -v "__pycache__" | xargs ls -la \
fi\n' start.sh
  fi

  # Clean up backup files
  rm start.sh.bak 2>/dev/null || true

  echo "Updated start.sh successfully"
  echo "New start.sh contents:"
  cat start.sh
else
  echo "Creating new start.sh script..."
  cat > start.sh << EOF
#!/bin/bash
# Flask application startup script

# Checking Flask application structure:
if [ -f "app.py" ]; then
  echo "Found app.py in root directory"
  cat app.py | head -10
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found app package with __init__.py"
  cat app/__init__.py | head -10
else
  echo "WARNING: Could not find expected Flask application file"
  find . -name "*.py" | grep -v "__pycache__" | xargs ls -la
fi

# Get the PORT from environment or use default
PORT=\${PORT:-5000}
echo "Starting server on port \$PORT..."

# Start gunicorn server
gunicorn $FLASK_APP_PATH --bind 0.0.0.0:\$PORT --log-level info
EOF
  chmod +x start.sh
  echo "Created new start.sh script"
fi

echo "===== WSGI CONFIGURATION FIX COMPLETE ====="
echo "The Flask application should now start correctly with Gunicorn"
echo "You can run './start.sh' to test locally or deploy to Render"
