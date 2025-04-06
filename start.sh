#!/bin/bash
# start.sh - Application startup script for Render deployment

set -e # Exit on error

echo "Starting Harmonic Universe application..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export RENDER=true
export FLASK_APP=backend.app:create_app
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$(pwd):$PYTHONPATH

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Determine the port to use (Render sets PORT automatically)
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Create static directory if it doesn't exist
mkdir -p static

# Create logs directory for application logs
mkdir -p logs

# Check and fix static files
echo "Checking static files..."
STATIC_DIR="static"
RENDER_STATIC_DIR="/opt/render/project/src/static"

if [ -d "$STATIC_DIR" ]; then
  file_count=$(find "$STATIC_DIR" -type f | wc -l)
  echo "Found $file_count files in static directory"
  
  if [ -f "$STATIC_DIR/index.html" ]; then
    echo "index.html exists in local static directory"
  else
    echo "WARNING: index.html not found in local static directory"
    
    # Check if index.html exists in Render static directory
    if [ -f "$RENDER_STATIC_DIR/index.html" ]; then
      echo "index.html found in Render static directory, copying to local static..."
      cp "$RENDER_STATIC_DIR/index.html" "$STATIC_DIR/"
    else
      echo "Creating fallback index.html..."
      cat > "$STATIC_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>The application is running. Please check the API status below:</p>
        <div id="status">Checking API...</div>
    </div>
    <script>
        // Check API health
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:green">API is running: ' + 
                    JSON.stringify(data) + '</strong>';
            })
            .catch(error => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:red">Error connecting to API: ' + 
                    error.message + '</strong>';
            });
    </script>
</body>
</html>
EOF
    fi
  fi
else
  echo "WARNING: Static directory not found, creating it"
  mkdir -p "$STATIC_DIR"
  
  # Create fallback index.html
  echo "Creating fallback index.html..."
  cat > "$STATIC_DIR/index.html" << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        h1 { color: #3498db; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>The application is running. Please check the API status below:</p>
        <div id="status">Checking API...</div>
    </div>
    <script>
        // Check API health
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:green">API is running: ' + 
                    JSON.stringify(data) + '</strong>';
            })
            .catch(error => {
                document.getElementById('status').innerHTML = 
                    '<strong style="color:red">Error connecting to API: ' + 
                    error.message + '</strong>';
            });
    </script>
</body>
</html>
EOF
fi

# Make sure static files are in the Render expected path
if [ -d "$RENDER_STATIC_DIR" ] && [ "$RENDER_STATIC_DIR" != "$STATIC_DIR" ]; then
  echo "Copying static files to Render static directory..."
  cp -r "$STATIC_DIR"/* "$RENDER_STATIC_DIR"/ || echo "Warning: Failed to copy to Render static directory"
fi

# Set the static folder environment variable
export STATIC_FOLDER="$STATIC_DIR"
export STATIC_URL_PATH=""

# Start the application with gunicorn
echo "Starting application with gunicorn..."
exec gunicorn backend.wsgi:app \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --threads 2 \
  --timeout 60 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --log-level info 