#!/bin/bash
set -e

echo "=== Starting Render Build Process ==="

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure static directory exists
mkdir -p static

# Check if static files already exist
if [ -f "static/index.html" ]; then
    echo "Static files already exist, preserving them"
else
    echo "Static files missing, creating emergency content"
    # Create emergency index file
    cat > static/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Harmonic Universe</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 40px; background: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: #fff; padding: 20px; border-radius: 5px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        p { color: #666; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Deployment successful! This is the emergency page.</p>
    </div>
</body>
</html>
EOF
fi

# Create a test file
echo "Creating test files..."
echo "<html><body><h1>Test Page</h1><p>If you can see this, static file serving is working.</p></body></html>" > static/test.html

# Set proper permissions
chmod -R 755 static

# List files
echo "=== Static Files ==="
ls -la static/

echo "=== Build Complete ==="
