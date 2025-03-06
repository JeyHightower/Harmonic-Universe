#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "=== Starting Build Process ==="

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Verify python-dotenv is installed
if pip list | grep -q python-dotenv; then
    echo "✅ python-dotenv is installed"
else
    echo "⚠️ Warning: python-dotenv is not installed. Installing now..."
    pip install python-dotenv
fi

# Ensure static directory exists
mkdir -p static

# Create test files
echo "Creating test files..."
cat > static/test.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Test Page</title>
</head>
<body>
    <h1>Test Page</h1>
    <p>If you can see this, static file serving is working correctly.</p>
</body>
</html>
EOF

echo "This is a test file to verify static file serving." > static/verify.txt

# Check if index.html exists and has content
if [ ! -f "static/index.html" ] || [ ! -s "static/index.html" ]; then
    echo "Creating guaranteed working index.html..."
    cat > static/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, system-ui, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
        }
        .container {
            max-width: 800px;
            margin: 40px auto;
            background: #fff;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        h1 { color: #333; margin-top: 0; }
        p { color: #666; line-height: 1.6; }
        .status {
            margin-top: 20px;
            padding: 15px;
            background: #f8f9fa;
            border-radius: 4px;
        }
        .port-info {
            margin-top: 10px;
            font-family: monospace;
            padding: 10px;
            background: #f1f1f1;
            border-radius: 4px;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to Harmonic Universe. The application is successfully serving static content.</p>

        <div class="status">
            <h2>Environment Information</h2>
            <div id="api-status">Loading...</div>

            <div class="port-info">
                <h3>PORT Information</h3>
                <p>Render.com automatically assigns a PORT through an environment variable.</p>
                <p>The application is configured to use this PORT.</p>
                <div id="port-value">Checking PORT value...</div>
            </div>
        </div>
    </div>

    <script>
        // Fetch health information
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    '<p><strong>Status:</strong> ' + data.status + '</p>' +
                    '<p><strong>Environment:</strong> ' + data.environment + '</p>' +
                    '<p><strong>Version:</strong> ' + data.version + '</p>';

                document.getElementById('port-value').innerHTML =
                    '<p><strong>Current PORT:</strong> ' + data.port + '</p>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    '<p>Error connecting to API: ' + error.message + '</p>';
            });
    </script>
</body>
</html>
EOF
fi

# Set permissions
chmod -R 755 static

# Verify that important files exist
if [ -f "app.py" ] && [ -f "wsgi.py" ] && [ -f "static/index.html" ]; then
    echo "✅ Core application files verified"
else
    echo "⚠️ WARNING: One or more core files are missing"
    ls -la
fi

# Make start script executable
chmod +x start.sh

echo "=== Build Complete ==="
echo "Static directory contents:"
ls -la static/
