#!/usr/bin/env bash
# Exit on error
set -o errexit

echo "Starting build script..."
NODE_VERSION=18
echo "Setting up Node.js version $NODE_VERSION..."
export NODE_VERSION=$NODE_VERSION
export PATH="$HOME/.volta/bin:$PATH"

if [ ! -d "$HOME/.volta" ]; then
  curl https://get.volta.sh | bash
  source $HOME/.volta/load.sh
fi

volta install node@$NODE_VERSION
node --version
npm --version

# Install dependencies
echo "Installing dependencies..."
npm ci

# Build frontend
echo "Building frontend..."
npm run build

# Create static directory if it doesn't exist
mkdir -p backend/static

# Make sure the old files are gone to avoid conflicts
echo "Cleaning static directory..."
rm -rf backend/static/*

# Copy the built files to backend/static
echo "Copying built files to backend/static..."
cp -r dist/* backend/static/

# Create a simple health check file
echo '{"status":"ok","timestamp":"'$(date -u +"%Y-%m-%dT%H:%M:%SZ")'"}'  > backend/static/health.json

# Create a fallback index.html in case the build fails
if [ ! -f "backend/static/index.html" ]; then
  echo "Creating fallback index.html..."
  cat > backend/static/index.html << 'EOL'
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

# Copy favicon to root of static directory
if [ -f "frontend/public/favicon.svg" ]; then
  echo "Copying favicon to static root..."
  cp frontend/public/favicon.svg backend/static/
  cp frontend/public/favicon.svg backend/static/favicon.ico
fi
if [ -f "frontend/public/favicon.ico" ]; then
  echo "Copying favicon.ico to static root..."
  cp frontend/public/favicon.ico backend/static/
fi

# Create a robots.txt to prevent indexing on non-production environments
if [ "$RENDER_ENV" != "production" ]; then
  echo "Creating robots.txt to prevent indexing in non-production environments..."
  cat > backend/static/robots.txt << 'EOL'
User-agent: *
Disallow: /
EOL
fi

# Copy the vite configuration for reference
cp frontend/vite.config.js backend/static/vite-config.js

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r backend/requirements.txt

# Run database migrations if needed
if [ -d "migrations" ]; then
  echo "Running database migrations..."
  flask db upgrade
fi

# Create a simple Python file to test static file serving
cat > backend/test_static.py << 'EOL'
import os
import json
from flask import Flask

app = Flask(__name__, static_folder='static', static_url_path='/')

@app.route('/api/health')
def health():
    return {"status": "ok", "environment": os.environ.get('FLASK_ENV', 'unknown')}

if __name__ == '__main__':
    static_dir = app.static_folder
    print(f"Static directory: {static_dir}")
    if os.path.exists(static_dir):
        print("Static directory exists")
        print("Files in static directory:")
        for root, dirs, files in os.walk(static_dir):
            for file in files:
                print(f" - {os.path.join(root, file)}")
    else:
        print("Static directory does not exist!")
    
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 10000)))
EOL

echo "Build script completed successfully!" 