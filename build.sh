#!/bin/bash
set -e  # Exit on error

echo "==== Starting Harmonic Universe Build Process ===="

# Install Python dependencies
pip install -r requirements.txt

# Determine static directory based on environment
if [ "$RENDER" = "true" ]; then
    STATIC_DIR="/opt/render/project/src/static"
else
    STATIC_DIR="static"
fi

# Create static directory
echo "Creating static directory at $STATIC_DIR"
mkdir -p "$STATIC_DIR"
chmod 755 "$STATIC_DIR"

# Create a basic index.html if it doesn't exist yet
if [ ! -f "$STATIC_DIR/index.html" ]; then
    echo "Creating basic index.html"
    cat > "$STATIC_DIR/index.html" << 'EOF'
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
        .status {
            margin-top: 20px;
            padding: 20px;
            border: 1px solid #ddd;
            border-radius: 8px;
        }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <div class="status">
        <p>Welcome to Harmonic Universe - an interactive web application for creating and exploring musical universes based on physics principles.</p>
        <p id="status">Checking application status...</p>
    </div>
    <script>
        fetch('/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status').textContent =
                    `Status: ${data.status}`;
            })
            .catch(error => {
                document.getElementById('status').textContent =
                    'Status: Error connecting to server';
            });
    </script>
</body>
</html>
EOF
    chmod 644 "$STATIC_DIR/index.html"
fi

# Handle frontend build
if [ -d "frontend" ]; then
    echo "Building frontend..."
    cd frontend

    # Install dependencies
    npm install

    # Run build
    npm run build

    # Check if build was successful
    if [ -d "dist" ]; then
        echo "Copying frontend build files to $STATIC_DIR"
        cp -r dist/* "../$STATIC_DIR/"
        echo "Frontend build copied successfully"
    else
        echo "Warning: Frontend build directory not found"
    fi

    cd ..
fi

# Verify setup
echo "==== Verifying Setup ===="
echo "Static directory contents:"
ls -la "$STATIC_DIR"
echo "Python modules installed:"
pip list
echo "Current directory structure:"
find . -type f -name "*.py" | sort

echo "==== Build Process Completed ===="
