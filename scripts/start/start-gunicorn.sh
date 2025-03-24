#!/bin/bash
echo "===== STARTING HARMONIC UNIVERSE WITH GUNICORN ====="
echo "Date: $(date)"

# Set environment variables
export PORT="${PORT:-10000}"
export NODE_ENV=production
export FLASK_ENV=production
export VITE_APP_ENV=production

echo "Using PORT: $PORT"
echo "NODE_ENV: $NODE_ENV"
echo "FLASK_ENV: $FLASK_ENV"
echo "VITE_APP_ENV: $VITE_APP_ENV"

# Ensure Python dependencies are installed
echo "Installing required dependencies..."
pip install -r requirements.txt

# Set Python path
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
  echo "Activating virtual environment"
  source .venv/bin/activate
elif [ -d "venv" ]; then
  echo "Activating virtual environment"
  source venv/bin/activate
fi

# Try different gunicorn approaches
echo "Starting gunicorn server..."
if command -v gunicorn &> /dev/null; then
  echo "Using system gunicorn"
  gunicorn wsgi:application --bind 0.0.0.0:$PORT --log-level debug
else
  echo "Using Python module gunicorn"
  python -m gunicorn wsgi:application --bind 0.0.0.0:$PORT --log-level debug
fi
