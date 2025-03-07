#!/bin/bash
# render_start.sh - Script to start the application on Render

set -e  # Exit immediately if a command fails
set -x  # Print each command before execution

echo "Starting application on Render..."

# Show current directory and files
echo "Current directory: $(pwd)"
echo "Python files: $(find . -name "*.py" | head -20)"

# Activate Python virtual environment
source .venv/bin/activate

# Verify Python packages
pip list | grep Flask
pip list | grep SQLAlchemy
pip list | grep gunicorn

# Ensure static directory exists and has correct permissions
mkdir -p static
chmod -R 755 static

# Check if index.html exists, if not, create it
if [ ! -f "static/index.html" ]; then
  echo "Creating index.html in static directory"
  cat > static/index.html << EOL
<!DOCTYPE html>
<html>
<head>
  <title>Harmonic Universe</title>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body>
  <div id="root">
    <h1>Harmonic Universe is running</h1>
    <p>If you see this message, static files are being served correctly.</p>
  </div>
</body>
</html>
EOL
  chmod 644 static/index.html
fi

# Also create a symlink to ensure the expected static directory exists
RENDER_STATIC_DIR="/opt/render/project/src/static"
if [ "$RENDER_STATIC_DIR" != "$(pwd)/static" ]; then
  mkdir -p "$(dirname $RENDER_STATIC_DIR)"
  # If already exists but is not a symlink, move it
  if [ -d "$RENDER_STATIC_DIR" ] && [ ! -L "$RENDER_STATIC_DIR" ]; then
    mv "$RENDER_STATIC_DIR" "${RENDER_STATIC_DIR}.bak"
  fi
  # Create symlink if it doesn't exist
  if [ ! -e "$RENDER_STATIC_DIR" ]; then
    ln -sf "$(pwd)/static" "$RENDER_STATIC_DIR"
    echo "Created symlink from $(pwd)/static to $RENDER_STATIC_DIR"
  fi
fi

# Set environment variables
export FLASK_APP=app.py
export STATIC_DIR="$(pwd)/static"
export PYTHONUNBUFFERED=1
export FLASK_DEBUG=0
export FLASK_ENV=production

# Log environment information
echo "Environment variables:"
echo "FLASK_APP=$FLASK_APP"
echo "STATIC_DIR=$STATIC_DIR"
echo "PORT=$PORT"
echo "PATH=$PATH"
echo "PYTHONPATH=$PYTHONPATH"

# Create a simple verify script
cat > verify_app.py << 'EOL'
#!/usr/bin/env python
import sys
import importlib.util
import os

def main():
    print("Python executable:", sys.executable)
    print("Python version:", sys.version)
    print("Current directory:", os.getcwd())

    try:
        import app
        print("Successfully imported app module")

        if hasattr(app, 'app'):
            print("Found app instance in app module")
            app_instance = app.app
            print("Routes:", list(app_instance.url_map.iter_rules()))
        elif hasattr(app, 'create_app'):
            print("Found create_app function in app module")
            app_instance = app.create_app()
            print("Routes:", list(app_instance.url_map.iter_rules()))
        else:
            print("ERROR: Could not find app instance or create_app function in app module")
            return 1

        return 0
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return 1

if __name__ == '__main__':
    sys.exit(main())
EOL
chmod +x verify_app.py

# Run the verify script
python verify_app.py

# Log static directory contents
echo "Static directory contents:"
ls -la $STATIC_DIR

# Clear any previous PID file
rm -f gunicorn.pid

# Start gunicorn with the correct configuration
echo "Starting gunicorn with wsgi_wrapper:app for improved reliability"
exec gunicorn "wsgi_wrapper:app" \
  --config gunicorn.conf.py \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --bind 0.0.0.0:${PORT:-10000}
