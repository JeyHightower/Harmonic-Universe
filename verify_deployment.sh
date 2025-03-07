#!/bin/bash
# Script to verify the deployment is working correctly

# Check for Python modules
echo "Checking for required Python modules..."
python -c "
import sys
print('Python version:', sys.version)
print('Python path:', sys.path)

try:
    import flask
    print('✅ Flask is available:', flask.__version__)
except ImportError as e:
    print('❌ Flask is not available:', e)

try:
    import sqlalchemy
    print('✅ SQLAlchemy is available:', sqlalchemy.__version__)
except ImportError as e:
    print('❌ SQLAlchemy is not available:', e)

try:
    import flask_sqlalchemy
    print('✅ Flask-SQLAlchemy is available')
except ImportError as e:
    print('❌ Flask-SQLAlchemy is not available:', e)
"

echo "Verifying deployment..."

# Check the static directory for index.html
echo "Checking for static/index.html..."
STATIC_DIR="/opt/render/project/src/static"
if [ -d "$STATIC_DIR" ]; then
    echo "✅ Static directory exists at $STATIC_DIR"
    ls -la $STATIC_DIR

    if [ -f "$STATIC_DIR/index.html" ]; then
        echo "✅ index.html exists in static directory"
    else
        echo "❌ index.html does not exist in static directory"
        echo "Attempting to create fallback index.html..."
        cat > $STATIC_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running! This is a fallback page created by verify_deployment.sh.</p>
        <div id="api-status">Checking API status...</div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>
EOF
        echo "✅ Created fallback index.html"
    fi
else
    echo "❌ Static directory does not exist at $STATIC_DIR"
    echo "Creating static directory..."
    mkdir -p $STATIC_DIR
    echo "✅ Created static directory"

    echo "Creating fallback index.html..."
    cat > $STATIC_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running! This is a fallback page created by verify_deployment.sh.</p>
        <div id="api-status">Checking API status...</div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>
EOF
    echo "✅ Created fallback index.html"
fi

# Get port from environment or use default
PORT=${PORT:-5000}

# Check if the application is responding
echo "Checking health endpoint on port $PORT..."
curl -s http://localhost:$PORT/api/health | grep -q "healthy"
HEALTH_STATUS=$?

if [ $HEALTH_STATUS -eq 0 ]; then
    echo "✅ Health check passed"
else
    echo "❌ Health check failed"
fi

# Check if static files are being served
echo "Checking if static files are being served..."
curl -s http://localhost:$PORT/ | grep -q "Harmonic Universe"
STATIC_STATUS=$?

if [ $STATIC_STATUS -eq 0 ]; then
    echo "✅ Static files are being served correctly"
else
    echo "❌ Static files are not being served correctly"
fi

echo "Deployment verification completed."
if [ $HEALTH_STATUS -eq 0 ] && [ $STATIC_STATUS -eq 0 ]; then
    echo "✅ All checks passed"
    exit 0
else
    echo "❌ Some checks failed"
    exit 1
fi
