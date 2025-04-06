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

# Define static directories
FLASK_STATIC_DIR="backend/app/static"
BACKUP_STATIC_DIR="static"
RENDER_STATIC_DIR="/opt/render/project/src/static"

# Create necessary directories
mkdir -p "$FLASK_STATIC_DIR"
mkdir -p "$BACKUP_STATIC_DIR"
mkdir -p logs

# Ensure static files are in all possible locations used by Flask
echo "Ensuring static files are in all necessary locations..."

# First check if Flask app static dir has files
if [ -d "$FLASK_STATIC_DIR" ] && [ "$(ls -A "$FLASK_STATIC_DIR" 2>/dev/null)" ]; then
  echo "Flask static directory has files, using as source"
  STATIC_SOURCE="$FLASK_STATIC_DIR"
elif [ -d "$BACKUP_STATIC_DIR" ] && [ "$(ls -A "$BACKUP_STATIC_DIR" 2>/dev/null)" ]; then
  echo "Using backup static directory as source"
  STATIC_SOURCE="$BACKUP_STATIC_DIR"
elif [ -d "$RENDER_STATIC_DIR" ] && [ "$(ls -A "$RENDER_STATIC_DIR" 2>/dev/null)" ]; then
  echo "Using Render static directory as source"
  STATIC_SOURCE="$RENDER_STATIC_DIR"
else
  echo "No static files found in any location, will create minimal fallback"
  STATIC_SOURCE=""
fi

# If we have a source with files, copy to all locations
if [ -n "$STATIC_SOURCE" ]; then
  echo "Copying from $STATIC_SOURCE to all static locations"
  
  # Copy to Flask app static dir if source is different
  if [ "$STATIC_SOURCE" != "$FLASK_STATIC_DIR" ]; then
    cp -r "$STATIC_SOURCE"/* "$FLASK_STATIC_DIR"/ || echo "Warning: Failed to copy to Flask static directory"
  fi
  
  # Copy to backup static dir if source is different
  if [ "$STATIC_SOURCE" != "$BACKUP_STATIC_DIR" ]; then
    cp -r "$STATIC_SOURCE"/* "$BACKUP_STATIC_DIR"/ || echo "Warning: Failed to copy to backup static directory"
  fi
  
  # Copy to Render static dir if it exists and source is different
  if [ -d "$RENDER_STATIC_DIR" ] && [ "$STATIC_SOURCE" != "$RENDER_STATIC_DIR" ]; then
    cp -r "$STATIC_SOURCE"/* "$RENDER_STATIC_DIR"/ || echo "Warning: Failed to copy to Render static directory"
  fi
else
  # Create a minimal index.html if no source exists
  echo "Creating minimal index.html in all static directories"
  for DIR in "$FLASK_STATIC_DIR" "$BACKUP_STATIC_DIR" "$RENDER_STATIC_DIR"; do
    if [ -d "$DIR" ]; then
      cat > "$DIR/index.html" << 'EOF'
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
  done
fi

# Display info about static files
for DIR in "$FLASK_STATIC_DIR" "$BACKUP_STATIC_DIR" "$RENDER_STATIC_DIR"; do
  if [ -d "$DIR" ]; then
    file_count=$(find "$DIR" -type f | wc -l)
    echo "Found $file_count files in $DIR"
    if [ -f "$DIR/index.html" ]; then
      echo "index.html exists in $DIR"
    else
      echo "WARNING: index.html NOT found in $DIR"
    fi
  else
    echo "WARNING: Directory $DIR does not exist"
  fi
done

# Set the static folder environment variable
export STATIC_FOLDER="$(pwd)/$FLASK_STATIC_DIR"
export STATIC_URL_PATH=""

# Create a .env file with critical environment variables
cat > .env << EOF
FLASK_APP=backend.app:create_app
FLASK_ENV=production
FLASK_DEBUG=0
STATIC_FOLDER=$(pwd)/$FLASK_STATIC_DIR
STATIC_URL_PATH=
RENDER=true
EOF

echo "Starting application with gunicorn..."
exec gunicorn backend.wsgi:app \
  --bind 0.0.0.0:$PORT \
  --workers 2 \
  --threads 2 \
  --timeout 60 \
  --access-logfile logs/access.log \
  --error-logfile logs/error.log \
  --log-level info 