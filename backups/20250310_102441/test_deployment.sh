#!/bin/bash
# Script to test the deployment locally

echo "======================================================="
echo "Testing minimal deployment solution locally"
echo "======================================================="

# Kill any existing processes running on port 10000
echo "Checking for existing processes on port 10000..."
PID=$(lsof -ti:10000 || echo "")
if [ -n "$PID" ]; then
    echo "Killing process $PID running on port 10000"
    kill -9 $PID
fi

# Set up environment
echo "Setting up environment..."
export PORT=10000
export FLASK_APP=app.py
export STATIC_DIR="$(pwd)/static"
export PYTHONPATH="$(pwd):$PYTHONPATH"

# Create static files
echo "Setting up static files..."
python setup_static.py

# Install dependencies
echo "Installing dependencies..."
pip install -r requirements.txt || echo "Warning: Some dependencies may not have installed properly"

# Start the application in the background
echo "Starting the application on port $PORT..."
python app.py &
APP_PID=$!

# Wait for the application to start
echo "Waiting for application to start..."
sleep 3

# Run tests
echo "Running tests..."
python test_app.py
TEST_RESULT=$?

# Test all endpoints directly
echo "Testing endpoints directly with curl..."
for endpoint in "/" "/health" "/api/health" "/ping" "/status" "/healthcheck" "/api/ping" "/api/status" "/api/healthcheck"; do
    echo "Testing $endpoint..."
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:10000$endpoint)
    if [ "$HTTP_CODE" -eq 200 ]; then
        echo "✅ $endpoint returned 200 OK"
    else
        echo "❌ $endpoint returned $HTTP_CODE"
        TEST_RESULT=1
    fi
done

# Clean up
echo "Cleaning up..."
kill $APP_PID

# Print result
if [ $TEST_RESULT -eq 0 ]; then
    echo "======================================================="
    echo "✅ All tests passed! Deployment should work on render.com"
    echo "======================================================="
    exit 0
else
    echo "======================================================="
    echo "❌ Some tests failed. Check the issues above."
    echo "======================================================="
    exit 1
fi
