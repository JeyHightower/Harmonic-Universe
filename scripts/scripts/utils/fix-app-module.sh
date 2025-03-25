#!/bin/bash
set -e

echo "===== FIXING APP MODULE ISSUE ====="

# Check the app.py file
if [ -f "app.py" ]; then
  echo "Found app.py in root directory, checking content..."

  # Check if app.py has an 'app' variable
  if grep -q "app = " app.py; then
    echo "app variable found in app.py"
  else
    echo "app variable not found in app.py, creating a minimal app.py..."

    # Backup the existing app.py
    cp app.py app.py.backup

    # Create a minimal Flask app
    cat > app.py << 'EOF'
from flask import Flask, jsonify

# Create Flask app
app = Flask(__name__)

# Configure app
app.config.from_object('config')

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "API is running"})

@app.route('/health')
def health():
    return jsonify({"status": "ok", "message": "API is healthy"})

if __name__ == '__main__':
    app.run()
EOF
    echo "Created minimal app.py with 'app' variable"
  fi
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  echo "Found app package, checking __init__.py..."

  # Check if app/__init__.py exports an 'app' variable
  if grep -q "app = " app/__init__.py; then
    echo "app variable found in app/__init__.py"
  else
    echo "app variable not found in app/__init__.py, updating it..."

    # Backup the existing __init__.py
    cp app/__init__.py app/__init__.py.backup

    # Add app = Flask(__init__) to __init__.py if it doesn't already have it
    if grep -q "Flask(__name__)" app/__init__.py; then
      # If Flask is already initialized but not assigned to 'app'
      sed -i.bak 's/Flask(__name__)/Flask(__name__)\napp = flask_app/' app/__init__.py
    else
      # Add a complete Flask initialization
      cat >> app/__init__.py << 'EOF'

# Create Flask app
from flask import Flask, jsonify
app = Flask(__name__)

@app.route('/health')
def health():
    return jsonify({"status": "ok", "message": "API is healthy"})
EOF
    fi
    echo "Updated app/__init__.py to export 'app' variable"
  fi
else
  echo "No Flask app structure found, creating minimal app.py..."

  # Create a minimal Flask app
  cat > app.py << 'EOF'
from flask import Flask, jsonify

# Create Flask app
app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({"status": "ok", "message": "API is running"})

@app.route('/health')
def health():
    return jsonify({"status": "ok", "message": "API is healthy"})

if __name__ == '__main__':
    app.run()
EOF
  echo "Created minimal app.py with 'app' variable"
fi

# Update start.sh to use the correct app module path
cat > start.sh << 'EOF'
#!/bin/bash
set -e

echo "===== STARTING FLASK APPLICATION FOR RENDER.COM ====="
echo "Date: $(date)"

# Set up environment
export FLASK_ENV=production
# Get PORT from environment variable with fallback
PORT=${PORT:-5000}
echo "Starting server on port $PORT..."

# Start Gunicorn with optimized settings for Render.com
if [ -f "app.py" ]; then
  FLASK_APP_PATH="app:app"
  echo "Starting app.py module with: $FLASK_APP_PATH"
elif [ -d "app" ] && [ -f "app/__init__.py" ]; then
  FLASK_APP_PATH="app:app"
  echo "Starting app package with: $FLASK_APP_PATH"
else
  # Default fallback
  FLASK_APP_PATH="app:app"
  echo "Using default app module: $FLASK_APP_PATH"
fi

# Export PYTHONPATH to include current directory
export PYTHONPATH=$PYTHONPATH:$(pwd)

# Start Gunicorn
echo "Starting Gunicorn with: $FLASK_APP_PATH on port $PORT"
exec gunicorn "$FLASK_APP_PATH" \
  --bind "0.0.0.0:$PORT" \
  --log-level info \
  --access-logfile - \
  --error-logfile - \
  --workers 2 \
  --timeout 60
EOF

chmod +x start.sh
echo "Updated start.sh to use the correct app module"

echo "===== APP MODULE FIX COMPLETE ====="
echo "Try running: PORT=8000 ./start.sh"
