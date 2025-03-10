#!/bin/bash
set -e

# Set test port environment variable
export TEST_PORT=8000
export FLASK_ENV=testing
export FLASK_DEBUG=1

echo "Setting up test environment..."

# Check if dependencies are installed
if ! pip list | grep -q Flask; then
  echo "Installing Flask dependencies..."
  pip install -r backend/requirements.txt
fi

# Ensure node modules are installed
if [ ! -d "node_modules" ]; then
  echo "Installing Node.js dependencies..."
  npm install
fi

# Ensure database migrations are up to date
if [ -d "backend/migrations" ]; then
  echo "Applying database migrations..."
  cd backend
  export FLASK_APP=run.py
  flask db upgrade
  cd ..
fi

# Ensure static directory exists
if [ ! -d "static" ]; then
  echo "Creating static directory..."
  mkdir -p static
  # Create a minimal index.html if needed
  if [ ! -f "static/index.html" ]; then
    echo "<!DOCTYPE html>
<html lang=\"en\">
<head>
    <meta charset=\"UTF-8\">
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">
    <title>Harmonic Universe</title>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application.</p>
</body>
</html>" > static/index.html
  fi
fi

echo "Starting Flask server for testing..."
cd backend
python run.py &
FLASK_PID=$!

# Wait for Flask to start
echo "Waiting for Flask server to start..."
sleep 2

# Run the tests
echo "Running tests..."
cd ..
npm test

# Clean up
echo "Cleaning up..."
kill $FLASK_PID

echo "Testing completed."
