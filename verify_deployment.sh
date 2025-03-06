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
if [ -d "static" ]; then
    echo "✅ Static directory exists"
    ls -la static
else
    echo "❌ Static directory missing"
fi

echo "Deployment verification completed."
exit $HEALTH_STATUS
