#!/bin/bash
# render_start.sh - Script to start the application on Render

set -e  # Exit immediately if a command fails
set -x  # Print each command before execution

echo "Starting application on Render..."

# Activate Python virtual environment
source .venv/bin/activate

# Verify Python packages
pip list

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

# Set environment variables
export FLASK_APP=app.py
export STATIC_DIR=$(pwd)/static
export PYTHONUNBUFFERED=1

# Log environment information
echo "Environment variables:"
echo "FLASK_APP=$FLASK_APP"
echo "STATIC_DIR=$STATIC_DIR"
echo "PORT=$PORT"

# Log static directory contents
echo "Static directory contents:"
ls -la $STATIC_DIR

# Start gunicorn with the correct configuration
exec gunicorn app:app \
  --config gunicorn.conf.py \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --bind 0.0.0.0:${PORT:-10000}
