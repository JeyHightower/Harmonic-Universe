#!/bin/bash
# Post-start script for Render.com
# This runs just before the application starts

set -e  # Exit on error

echo "=== Starting Harmonic Universe ==="
echo "Date: $(date)"
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# Ensure static directory exists
STATIC_DIR=${STATIC_DIR:-"/opt/render/project/src/static"}
mkdir -p "$STATIC_DIR"
chmod 755 "$STATIC_DIR"

# Copy static files if they exist in the local static directory
if [ -d "static" ] && [ "$(ls -A static 2>/dev/null)" ]; then
    echo "Copying static files to $STATIC_DIR..."
    cp -R static/* "$STATIC_DIR/"
fi

# Create minimal index.html if it doesn't exist
if [ ! -f "$STATIC_DIR/index.html" ]; then
    echo "Creating minimal index.html..."
    cat > "$STATIC_DIR/index.html" << 'EOF'
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
    <p>Application is running! This is a test page.</p>
    <div id="api-status">Checking API status...</div>
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
    chmod 644 "$STATIC_DIR/index.html"
fi

# Ensure virtual environment exists
if [ ! -d ".venv" ]; then
    echo "Virtual environment not found. Creating..."
    python -m venv .venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source .venv/bin/activate

# Verify Python environment
echo "Python version: $(python --version)"
echo "Pip version: $(pip --version)"
echo "Virtual env: $VIRTUAL_ENV"

# Verify dependencies are installed
echo "Verifying dependencies..."
python -c "
import flask
import sqlalchemy
import flask_sqlalchemy
print(f'Flask version: {flask.__version__}')
print(f'SQLAlchemy version: {sqlalchemy.__version__}')
print(f'Flask-SQLAlchemy version: {flask_sqlalchemy.__version__}')
print('All required packages are available')
"

# Export additional environment variables
export PYTHONUNBUFFERED=1
export FLASK_ENV=production
export STATIC_DIR="$STATIC_DIR"

echo "Start script completed successfully"
echo "Starting application with Gunicorn..."

# Start Gunicorn with our configuration
exec gunicorn -c gunicorn.conf.py wsgi:app \
    --bind 0.0.0.0:$PORT \
    --workers 4 \
    --threads 2 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --log-level debug
