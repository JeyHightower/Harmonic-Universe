#!/bin/bash
# Startup script for Harmonic Universe on Render.com

set -e  # Exit on any error

echo "=== Starting Harmonic Universe on Render.com ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node --version)"

# Ensure main static directories exist
export STATIC_DIR="/opt/render/project/src/static"
mkdir -p $STATIC_DIR
echo "Created static directory: $STATIC_DIR"

mkdir -p static
echo "Created local static directory: static"

mkdir -p app/static
echo "Created app/static directory"

# Create assets directory in all static locations
mkdir -p $STATIC_DIR/assets
mkdir -p static/assets
mkdir -p app/static/assets
echo "Created assets directories"

# Create default index.html if it doesn't exist
echo "Checking for index.html..."

INDEX_HTML="<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            max-width: 800px;
            padding: 2rem;
            background-color: rgba(0, 0, 0, 0.2);
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(10px);
            text-align: center;
        }
        h1 {
            font-size: 3rem;
            margin-bottom: 1rem;
            text-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }
        p {
            font-size: 1.2rem;
            line-height: 1.6;
            margin-bottom: 1.5rem;
        }
        .button-container {
            display: flex;
            flex-wrap: wrap;
            justify-content: center;
            gap: 1rem;
            margin-top: 2rem;
        }
        .button {
            display: inline-block;
            background: rgba(255, 255, 255, 0.2);
            color: white;
            text-decoration: none;
            padding: 0.8rem 1.8rem;
            border-radius: 30px;
            font-weight: bold;
            transition: all 0.3s ease;
            margin: 0.5rem;
        }
        .button:hover {
            transform: translateY(-3px);
            box-shadow: 0 10px 20px rgba(0, 0, 0, 0.2);
            background: rgba(255, 255, 255, 0.3);
        }
        .button-primary {
            background: linear-gradient(to right, #4facfe 0%, #00f2fe 100%);
        }
        .button-secondary {
            background: linear-gradient(to right, #f093fb 0%, #f5576c 100%);
        }
        .button-tertiary {
            background: linear-gradient(to right, #43e97b 0%, #38f9d7 100%);
        }
    </style>
</head>
<body>
    <div class=\"container\">
        <h1>Harmonic Universe</h1>
        <p>Explore the fascinating connection between music and physics.</p>
        <div class=\"button-container\">
            <a href=\"/login\" class=\"button button-primary\">Login</a>
            <a href=\"/signup\" class=\"button button-secondary\">Sign Up</a>
            <a href=\"/demo\" class=\"button button-tertiary\">Try Demo</a>
        </div>
    </div>
</body>
</html>"

# Create index.html in all static directories
for dir in "$STATIC_DIR" "static" "app/static"; do
  if [ ! -f "$dir/index.html" ]; then
    echo "Creating index.html in $dir"
    echo "$INDEX_HTML" > "$dir/index.html"
    echo "✅ Created index.html in $dir"
  else
    echo "✅ Found existing index.html in $dir"
  fi
done

# Verify index.html exists in all directories
for dir in "$STATIC_DIR" "static" "app/static"; do
  if [ -f "$dir/index.html" ]; then
    echo "✅ Verified index.html exists in $dir"
    # Make sure permissions are correct
    chmod 644 "$dir/index.html"
  else
    echo "❌ ERROR: index.html is missing in $dir, attempting to create it again"
    echo "$INDEX_HTML" > "$dir/index.html"
    chmod 644 "$dir/index.html"
  fi
done

# Create symbolic links between static directories for redundancy
echo "Creating symbolic links for redundancy..."
cp -rf $STATIC_DIR/* app/static/ 2>/dev/null || echo "Warning: Could not copy files to app/static"
cp -rf $STATIC_DIR/* static/ 2>/dev/null || echo "Warning: Could not copy files to static"

# Setup environment variables
export RENDER=true
export FLASK_APP=app
export FLASK_ENV=production

# Debug: Display content of directories
echo "=== Static directory contents ==="
ls -la $STATIC_DIR
echo "=== app/static directory contents ==="
ls -la app/static
echo "=== static directory contents ==="
ls -la static
echo "=== Current directory structure ==="
find . -maxdepth 2 -type d | sort

# Run the setup script to ensure all static files exist
echo "Running setup script..."
python setup_render.py

# Debug: Display routes in the application
echo "=== Checking application routes ==="
python -m app.wsgi print_routes || echo "Warning: Could not print routes"

# Start the application with Gunicorn using app.wsgi:application
echo "Starting Gunicorn with app.wsgi:application..."
gunicorn app.wsgi:application --bind=0.0.0.0:${PORT:-10000} --workers=1 --timeout=120
