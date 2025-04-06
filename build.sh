#!/bin/bash
# build.sh - Comprehensive build script for Render deployment

set -e # Exit on error

echo "Starting Harmonic Universe build process..."
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version || echo 'Node not found')"

# Set environment variables for deployment
export RENDER=true
export FLASK_ENV=production
export FLASK_DEBUG=0

# Fix PostgreSQL URL format if needed
if [[ $DATABASE_URL == postgres://* ]]; then
  export DATABASE_URL=${DATABASE_URL/postgres:\/\//postgresql:\/\/}
  echo "Fixed DATABASE_URL format from postgres:// to postgresql://"
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Create static directory
mkdir -p static

# Build frontend
echo "Building frontend assets..."
if [ -d "frontend" ]; then
  cd frontend
  
  echo "Installing frontend dependencies..."
  npm install
  
  echo "Building frontend production bundle..."
  npm run build
  
  # Copy built files to static directory
  echo "Copying built files to static directory..."
  if [ -d "build" ]; then
    cp -r build/* ../static/
  elif [ -d "dist" ]; then
    cp -r dist/* ../static/
  else
    echo "WARNING: No build output found in expected directories"
    ls -la
  fi
  
  cd ..
else
  echo "No frontend directory found, skipping frontend build"
fi

# Ensure static directory exists and has an index.html
if [ ! -f "static/index.html" ]; then
  echo "No index.html found in static directory, creating a placeholder"
  
  cat > static/index.html << 'EOF'
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

# Copy static files to expected Render location
mkdir -p /opt/render/project/src/static
cp -r static/* /opt/render/project/src/static/ || echo "Warning: Could not copy to Render path"

# Set up database if needed
echo "Setting up database..."
export FLASK_APP=backend.app:create_app

# Run database migrations
echo "Running database migrations..."
cd backend
python -m flask db upgrade
cd ..

echo "Build process completed successfully" 