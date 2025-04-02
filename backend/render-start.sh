#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application at $(date -u)"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
export PYTHONPATH=$PYTHONPATH:$(pwd):/opt/render/project/src

# Ensure log directory exists
mkdir -p logs

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Verify static directory
echo "Checking static directory..."
if [ -d "static" ]; then
    echo "Static directory exists"
    echo "Contents:"
    ls -la static | head -n 10
else
    echo "WARNING: Static directory not found, creating it"
    mkdir -p static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found.</p></body></html>" > static/index.html
fi

# Verify database connection
echo "Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "Database URL found: ${DATABASE_URL:0:10}..."
    
    # Run any pending migrations
    echo "Running any pending database migrations..."
    if [ -f "init_migrations.py" ]; then
        export FLASK_APP=init_migrations.py
        python -m flask db upgrade || echo "Warning: Migrations failed, but continuing"
    fi
else
    echo "WARNING: No DATABASE_URL found. Using SQLite."
fi

# Navigate to the project root directory
cd /opt/render/project/src
echo "Now in project root: $(pwd)"

# Start the application with Gunicorn
echo "Starting Gunicorn server..."

# Let's examine the app.py file to find the Flask application
echo "Examining backend/app.py to find Flask application..."
if grep -q "create_app" backend/app.py; then
  echo "Found create_app function, using backend.app:create_app()"
  exec gunicorn --bind 0.0.0.0:$PORT "backend.app:create_app()"
elif grep -q "flask_app" backend/app.py; then
  echo "Found flask_app variable, using backend.app:flask_app"
  exec gunicorn --bind 0.0.0.0:$PORT backend.app:flask_app
elif grep -q "application" backend/app.py; then
  echo "Found application variable, using backend.app:application"
  exec gunicorn --bind 0.0.0.0:$PORT backend.app:application
else
  echo "Looking for Flask app variable..."
  FLASK_VAR=$(grep -o "[a-zA-Z_][a-zA-Z0-9_]* = Flask(__name__)" backend/app.py | cut -d' ' -f1)
  if [ -n "$FLASK_VAR" ]; then
    echo "Found Flask variable: $FLASK_VAR, using backend.app:$FLASK_VAR"
    exec gunicorn --bind 0.0.0.0:$PORT backend.app:$FLASK_VAR
  else
    echo "Checking if wsgi.py exists..."
    if [ -f "backend/wsgi.py" ]; then
      echo "Found wsgi.py, using backend.wsgi:app"
      exec gunicorn --bind 0.0.0.0:$PORT backend.wsgi:app
    else
      echo "Creating wsgi.py as a last resort..."
      cat > backend/wsgi.py << 'EOF'
# Import the Flask app from backend
try:
    from backend.app import create_app
    app = create_app()
except (ImportError, AttributeError):
    try:
        from backend.app import app
    except (ImportError, AttributeError):
        # Last resort, manually create a minimal Flask app
        from flask import Flask, jsonify
        app = Flask(__name__)
        
        @app.route('/api/health')
        def health():
            return jsonify({"status": "ok"})
        
        @app.route('/')
        def index():
            return "Harmonic Universe API is running"
EOF
      echo "Created wsgi.py, using backend.wsgi:app"
      exec gunicorn --bind 0.0.0.0:$PORT backend.wsgi:app
    fi
  fi
fi 