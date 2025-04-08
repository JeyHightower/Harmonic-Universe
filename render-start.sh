#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting Harmonic Universe application..."

# Set environment variables for Flask
export FLASK_APP=backend/wsgi.py
export FLASK_ENV=${FLASK_ENV:-production}
export FLASK_DEBUG=${FLASK_DEBUG:-0}
export STATIC_FOLDER=backend/static
export PYTHONPATH=${PYTHONPATH:-.}

# Check if static directory exists and has files
if [ -d "$STATIC_FOLDER" ]; then
  echo "Static directory exists at $STATIC_FOLDER"
  file_count=$(find "$STATIC_FOLDER" -type f | wc -l)
  echo "Static directory contains $file_count files"
  
  # List some key files
  if [ -f "$STATIC_FOLDER/index.html" ]; then
    echo "✅ index.html exists"
  else
    echo "❌ index.html is missing!"
  fi
  
  if [ -f "$STATIC_FOLDER/assets/index-*.js" ] || [ -f "$STATIC_FOLDER/index-*.js" ]; then
    echo "✅ Main JavaScript bundle exists"
  else
    echo "❌ Main JavaScript bundle is missing!"
  fi
else
  echo "❌ Static directory not found at $STATIC_FOLDER"
  # Create the directory if it doesn't exist
  mkdir -p "$STATIC_FOLDER"
fi

# Run database migrations if needed
if [ -d "migrations" ]; then
  echo "Running database migrations..."
  cd backend && flask db upgrade
  cd ..
fi

# Create a health check endpoint that will be used to verify the application is running
mkdir -p "$STATIC_FOLDER"
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'  > "$STATIC_FOLDER/health.json"

# Check if we need to create a fallback index.html
if [ ! -f "$STATIC_FOLDER/index.html" ]; then
  echo "Creating fallback index.html..."
  cat > "$STATIC_FOLDER/index.html" << 'EOL'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; color: #333; }
        .container { max-width: 800px; margin: 0 auto; padding: 2rem; }
        h1 { color: #2c3e50; }
        .card { background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <div class="card">
            <h2>Application Loading...</h2>
            <p>If you continue to see this message, please contact support.</p>
        </div>
    </div>
</body>
</html>
EOL
fi

# Start the application using Gunicorn
echo "Starting application with Gunicorn..."
cd backend
exec gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 wsgi:app