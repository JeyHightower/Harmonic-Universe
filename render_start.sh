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

# Create a minimal index.html if it doesn't exist
if [ ! -f "/opt/render/project/src/static/index.html" ]; then
    echo "Creating minimal index.html in Render-specific static path..."
    cat > /opt/render/project/src/static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            margin: 0;
            padding: 0;
            background-color: #f5f5f5;
            color: #333;
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        header {
            background-color: #2c3e50;
            color: white;
            padding: 20px;
            text-align: center;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        main {
            flex: 1;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
            background-color: white;
            box-shadow: 0 0 15px rgba(0, 0, 0, 0.05);
        }
        h1 { margin: 0; color: white; }
        .status-box {
            border: 1px solid #ddd;
            padding: 20px;
            border-radius: 8px;
            margin-top: 30px;
            background-color: #f9f9f9;
        }
    </style>
</head>
<body>
    <header>
        <h1>Harmonic Universe</h1>
        <p>Interactive Music Experience</p>
    </header>
    <main>
        <h2>Welcome!</h2>
        <p>The Harmonic Universe application is running.</p>
        <div class="status-box">
            <h3>Application Status</h3>
            <p id="status-message">Checking API status...</p>
        </div>
    </main>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('status-message').textContent =
                    'API Status: ' + (data.status || 'Unknown');
            })
            .catch(error => {
                document.getElementById('status-message').textContent =
                    'API Status: Connection Failed';
            });
    </script>
</body>
</html>
EOF
    chmod 644 /opt/render/project/src/static/index.html
    echo "Created index.html in Render static directory"
fi

# Copy static files from local directory to Render-specific path if they exist
if [ -d "static" ] && [ "$(ls -A static 2>/dev/null)" ]; then
    echo "Copying static files to Render-specific path..."
    cp -R static/* /opt/render/project/src/static/
    echo "Copied static files to Render directory"
fi

# List static directory contents for verification
echo "Local static directory contents:"
ls -la static/

echo "Render-specific static directory contents:"
ls -la /opt/render/project/src/static/

echo "Start script completed successfully"
echo "Starting application..."

# Start Gunicorn with our configuration
exec gunicorn -c gunicorn.conf.py wsgi:app
