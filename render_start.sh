#!/bin/bash
# Post-start script for Render.com
# This runs just before the application starts

set -e  # Exit on error

echo "=============== RENDER START SCRIPT ==============="
echo "Current directory: $(pwd)"
echo "Environment: RENDER=${RENDER}"

# Ensure static directory exists with correct permissions
echo "Ensuring static directory exists..."
mkdir -p static
chmod 755 static

# Also ensure the Render-specific directory exists
mkdir -p /opt/render/project/src/static
chmod 755 /opt/render/project/src/static

# Check if index.html exists in the static directory
if [ ! -f "static/index.html" ]; then
    echo "Creating emergency fallback index.html in static directory..."
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>This page was created by the render_start.sh script as a fallback.</p>
</body>
</html>
EOF
    chmod 644 static/index.html
fi

# Check if index.html exists in the Render-specific static directory
if [ ! -f "/opt/render/project/src/static/index.html" ]; then
    echo "Creating emergency fallback index.html in Render-specific static directory..."
    cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>This page was created by the render_start.sh script as a fallback.</p>
</body>
</html>
EOF
    chmod 644 /opt/render/project/src/static/index.html
fi

# Copy static files from local directory to Render-specific path if they exist
if [ -d "static" ] && [ "$(ls -A static 2>/dev/null)" ]; then
    echo "Copying static files to Render-specific path..."
    cp -R static/* /opt/render/project/src/static/
fi

# Run the static symlink script if available
if [ -f "app_static_symlink.py" ]; then
    echo "Running static symlink script..."
    python app_static_symlink.py
fi

# List static directory contents for verification
echo "Local static directory contents:"
ls -la static/

echo "Render-specific static directory contents:"
ls -la /opt/render/project/src/static/

# Run the diagnostic Python script if available
if [ -f "render_diagnose.py" ]; then
    echo "Running diagnostic script..."
    python render_diagnose.py
fi

echo "Start script completed successfully"
echo "Starting application..."

# Pass control to gunicorn
exec gunicorn wsgi:app
