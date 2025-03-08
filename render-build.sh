#!/usr/bin/env bash
set -o errexit

echo "=== Starting Harmonic Universe Build Process ==="
echo "Python version: $(python --version)"
echo "Current directory: $(pwd)"

# Install gunicorn globally first
echo "Installing gunicorn globally..."
pip install gunicorn

# Install project dependencies
echo "Installing Python dependencies..."
pip install --upgrade pip
if [ -f requirements.txt ]; then
  pip install -r requirements.txt
fi

# Create a direct path to gunicorn for our start script to use
GUNICORN_PATH=$(which gunicorn)
echo "Gunicorn found at: $GUNICORN_PATH"
echo "export GUNICORN_PATH=$GUNICORN_PATH" > gunicorn_path.sh
chmod +x gunicorn_path.sh

# Check if gunicorn is installed and available
if [ -z "$GUNICORN_PATH" ]; then
  echo "ERROR: Gunicorn not found in PATH"
  # Try installing with pip3
  pip3 install gunicorn
  GUNICORN_PATH=$(which gunicorn)
  echo "Retry - Gunicorn found at: $GUNICORN_PATH"
  echo "export GUNICORN_PATH=$GUNICORN_PATH" > gunicorn_path.sh
fi

# Create a wrapper script that directly calls gunicorn
echo "Creating gunicorn wrapper script..."
cat > run_gunicorn.sh << 'EOF'
#!/bin/bash
# Direct gunicorn execution script
PATH=$PATH:~/.local/bin:/usr/local/bin:/usr/bin
echo "PATH: $PATH"
echo "Current directory: $(pwd)"

# Try multiple ways to find gunicorn
GUNICORN=$(which gunicorn 2>/dev/null || echo "")
if [ -z "$GUNICORN" ]; then
  GUNICORN=~/.local/bin/gunicorn
fi
if [ ! -x "$GUNICORN" ]; then
  GUNICORN=python -m gunicorn
fi

echo "Using gunicorn: $GUNICORN"

# Execute gunicorn with the provided arguments
if [ -f wsgi.py ]; then
  echo "Running wsgi:application"
  exec $GUNICORN wsgi:application --bind 0.0.0.0:$PORT --log-level info
elif [ -f app/wsgi.py ]; then
  echo "Running app.wsgi:application"
  exec $GUNICORN app.wsgi:application --bind 0.0.0.0:$PORT --log-level info
else
  echo "Running app:app"
  exec $GUNICORN app:app --bind 0.0.0.0:$PORT --log-level info
fi
EOF
chmod +x run_gunicorn.sh

# Verify gunicorn installation
echo "Verifying gunicorn installation:"
which gunicorn || echo "WARNING: gunicorn not found in PATH"
pip list | grep gunicorn

# Setup static files if needed
if [ -f app_static_symlink.py ]; then
  python app_static_symlink.py
fi

echo "Build process completed successfully!"
