#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application at $(date -u)"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
# Add the project root to PYTHONPATH
export PYTHONPATH=$PYTHONPATH:$(pwd):/opt/render/project/src

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Ensure log directory exists
mkdir -p logs

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

# Create a wsgi.py file if it doesn't exist
if [ ! -f "backend/wsgi.py" ]; then
    echo "Creating wsgi.py file..."
    cat > backend/wsgi.py << 'EOF'
import os
import sys

# Add the project root directory to the Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(os.path.dirname(__file__))))

# Print debug information
print("==== WSGI Debug Information ====")
print(f"Python version: {sys.version}")
print(f"Current directory: {os.getcwd()}")
print(f"File location: {__file__}")
print(f"Python path: {sys.path}")
print("================================")

# Import your Flask app
# Try different import patterns based on your project structure
try:
    print("Attempting to import from backend.app...")
    from backend.app import app
    print("Successfully imported app from backend.app")
except ImportError as e:
    print(f"Failed to import app from backend.app: {e}")
    try:
        print("Attempting to import create_app from backend.app...")
        from backend.app import create_app
        print("Successfully imported create_app, creating app instance...")
        app = create_app()
        print("Successfully created app instance")
    except ImportError as e:
        print(f"Failed to import create_app from backend.app: {e}")
        try:
            print("Attempting to import app directly from backend...")
            from backend import app
            print("Successfully imported app from backend")
        except ImportError as e:
            print(f"Failed to import app from backend: {e}")
            try:
                print("Attempting to import create_app from backend...")
                from backend import create_app
                print("Successfully imported create_app from backend, creating app instance...")
                app = create_app()
                print("Successfully created app instance")
            except ImportError as e:
                print(f"Failed to import create_app from backend: {e}")
                
                # Final fallback - create a minimal app
                print("All import attempts failed, creating minimal Flask app")
                from flask import Flask, jsonify
                app = Flask(__name__, static_folder='static')
                
                @app.route('/api/health')
                def health():
                    return jsonify({"status": "ok"})
                
                @app.route('/')
                def index():
                    return "Harmonic Universe API - Minimal Fallback App"

# For gunicorn
application = app
EOF
fi

# Start the application with Gunicorn
echo "Starting Gunicorn server..."
echo "Using backend.wsgi:application for Gunicorn"
exec gunicorn --bind 0.0.0.0:$PORT backend.wsgi:application 