#!/bin/bash
# Simple start script for Render.com

set -e  # Exit on any error

echo "=== Starting Harmonic Universe on Render.com ==="
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Ensure static directories exist
export STATIC_DIR="/opt/render/project/src/static"
mkdir -p $STATIC_DIR
echo "Created static directory: $STATIC_DIR"

mkdir -p static
echo "Created local static directory: static"

mkdir -p app/static
echo "Created app/static directory"

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
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif;
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            min-height: 100vh;
            margin: 0;
            padding: 0;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
        }
        .container {
            background-color: white;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            padding: 30px;
            max-width: 600px;
        }
        h1 {
            color: #3f51b5;
            margin-bottom: 10px;
        }
        p {
            color: #555;
            margin-bottom: 20px;
            line-height: 1.5;
        }
        .btn {
            display: inline-block;
            background-color: #3f51b5;
            color: white;
            padding: 10px 20px;
            border-radius: 5px;
            text-decoration: none;
            font-weight: bold;
            transition: background-color 0.3s;
        }
        .btn:hover {
            background-color: #303f9f;
        }
    </style>
</head>
<body>
    <div class=\"container\">
        <h1>Harmonic Universe</h1>
        <p>Welcome to Harmonic Universe! The application is successfully running on Render.com.</p>
        <p>If you're seeing this page, static files are being served correctly.</p>
        <a href=\"/api/health\" class=\"btn\">Check API Health</a>
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
ln -sf $STATIC_DIR/* app/static/ 2>/dev/null || echo "Warning: Could not create symlinks to app/static"
ln -sf $STATIC_DIR/* static/ 2>/dev/null || echo "Warning: Could not create symlinks to static"

# Debug: Display content of directories
echo "=== Static directory contents ==="
ls -la $STATIC_DIR
echo "=== app/static directory contents ==="
ls -la app/static
echo "=== static directory contents ==="
ls -la static
echo "=== Current directory structure ==="
find . -maxdepth 2 -type d | sort

# Run the setup script
echo "Running setup script..."
python setup_render.py

# Debug: Display routes in the application
echo "=== Checking application routes ==="
python -m app.wsgi print_routes || echo "Warning: Could not print routes"

# Start the application with Gunicorn using app.wsgi:application
echo "Starting Gunicorn with app.wsgi:application..."
gunicorn app.wsgi:application --bind=0.0.0.0:${PORT:-10000} --workers=1 --timeout=120
