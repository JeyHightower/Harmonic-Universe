#!/bin/bash
set -e

# Determine the correct WSGI application path
if [ -f "app.py" ]; then
  FLASK_APP_PATH="app:app"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  FLASK_APP_PATH="app:app"
else
  FLASK_APP_PATH="app:app"  # Default fallback
fi

# Create a clean start.sh file
cat > start.sh << EOF
#!/bin/bash
# Flask application startup script

# Get the PORT from environment or use default
PORT=\\\${PORT:-5000}
echo "Starting server on port \\\$PORT..."

# Start gunicorn server
gunicorn $FLASK_APP_PATH --bind 0.0.0.0:\\\$PORT --log-level info
