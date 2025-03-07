#!/bin/bash
set -e  # Exit on error

echo "==== Starting Harmonic Universe Build Process ===="

# Install Python dependencies
pip install -r requirements.txt

# Create static directory if it doesn't exist
mkdir -p static

# Create a basic index.html if it doesn't exist yet
if [ ! -f "static/index.html" ]; then
    echo "Creating basic index.html in static folder"
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            text-align: center;
        }
        h1 { color: #336699; }
        .logo { max-width: 300px; margin: 20px auto; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to Harmonic Universe - an interactive web application for creating and exploring musical universes based on physics principles.</p>
    <p>The application is currently loading...</p>
</body>
</html>
EOF
fi

# Create a CSS file to verify static serving
echo "Creating test.css to verify static file serving"
cat > static/test.css << 'EOF'
body { background-color: #f8f8f8; }
EOF

# If there's a frontend directory with build process
if [ -d "frontend" ] && [ -f "frontend/package.json" ]; then
    echo "Building frontend..."
    cd frontend
    npm install
    npm run build
    cd ..

    # Copy frontend build files to static directory
    if [ -d "frontend/build" ]; then
        echo "Copying frontend build files to static directory"
        cp -r frontend/build/* static/
    elif [ -d "frontend/dist" ]; then
        echo "Copying frontend dist files to static directory"
        cp -r frontend/dist/* static/
    fi
fi

# Create a test json file for health checks
echo "Creating health check test file"
cat > static/health.json << 'EOF'
{"status": "ok"}
EOF

# Set proper permissions
chmod -R 755 static

echo "==== Verifying Setup ===="
echo "Static directory contents:"
ls -la static/
echo "Python modules installed:"
pip list
echo "Current directory structure:"
find . -type f -name "*.py" | sort

echo "==== Build Process Completed ===="
