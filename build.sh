#!/bin/bash
set -e  # Exit immediately if a command exits with a non-zero status

echo "=== Starting Render Build Process ==="

# Install Python dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
pip install -r requirements.txt

# Ensure static directory exists
mkdir -p static

# Create a test file
echo "Creating test files..."
echo "<html><body><h1>Test Page</h1><p>If you can see this, static file serving is working.</p></body></html>" > static/test.html
echo "This is a test file to verify static file serving." > static/verify.txt

# Create a guaranteed working index.html
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
            color: #333;
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
        p { color: #666; line-height: 1.5; }
        .status { margin-top: 20px; padding: 15px; background: #f8f9fa; border-radius: 4px; }
        .loading { display: inline-block; width: 20px; height: 20px; border: 3px solid rgba(0,0,0,0.1); border-radius: 50%; border-top-color: #3498db; animation: spin 1s ease-in-out infinite; margin-right: 10px; vertical-align: middle; }
        @keyframes spin { to { transform: rotate(360deg); } }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Welcome to Harmonic Universe. This page confirms that your application is successfully serving static content.</p>

        <div class="status">
            <div id="api-status">
                <div class="loading"></div> Checking API connection...
            </div>
        </div>
    </div>

    <script>
        // Check API health
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    '<strong>API Status:</strong> Connected<br>' +
                    '<strong>Version:</strong> ' + (data.version || 'Unknown') + '<br>' +
                    '<strong>Environment:</strong> ' + (data.environment || 'Unknown');
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    '<strong>API Status:</strong> Error - Could not connect to API<br>' +
                    '<strong>Error:</strong> ' + error.message;
            });
    </script>
</body>
</html>
EOF

# Verify index.html was created successfully
if [ -f "static/index.html" ]; then
    echo "index.html created successfully ($(wc -c < static/index.html) bytes)"
else
    echo "ERROR: Failed to create index.html"
    exit 1
fi

# Set proper permissions
chmod -R 755 static

# List static directory contents
echo "=== Static Directory Contents ==="
ls -la static/

echo "=== Build Complete ==="
