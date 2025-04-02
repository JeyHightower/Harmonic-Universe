#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application at $(date -u)"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"
echo "Node version: $(node -v || echo 'Node.js not found')"
echo "NPM version: $(npm -v || echo 'NPM not found')"

# Navigate to the project root
cd /opt/render/project/src
echo "Now in project root: $(pwd)"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    echo "Activating virtual environment..."
    source .venv/bin/activate
fi

# Set environment variables
export FLASK_APP=app.py
export FLASK_ENV=production
# Add the project root to PYTHONPATH including both project root and backend
export PYTHONPATH=$PYTHONPATH:/opt/render/project/src:/opt/render/project/src/backend

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Run the import fixer script if it exists
if [ -f "fix_imports.py" ]; then
    echo "Running import fixer script..."
    python fix_imports.py || echo "Warning: Import fixer script failed, continuing anyway"
fi

# Create an app.py in the root directory if it doesn't exist
if [ ! -f "app.py" ]; then
    echo "Creating app.py in root directory..."
    cat > app.py << 'EOF'
# Re-export everything from backend.app
try:
    from backend.app import *
    print("Successfully re-exported from backend.app")
except ImportError as e:
    print(f"Warning: Could not import from backend.app: {e}")
    try:
        # Alternative: try to import specific components
        try:
            from backend.app import app
            print("Successfully imported app from backend.app")
        except ImportError:
            pass
            
        try:
            from backend.app import create_app
            print("Successfully imported create_app from backend.app")
        except ImportError:
            pass
    except Exception as e:
        print(f"Error attempting to import specific components: {e}")

# Print a message to indicate this file was loaded
print("Root app.py module loaded")
EOF
    echo "Created app.py in root directory"
fi

# Ensure needed directories exist
mkdir -p logs
mkdir -p static

# Check for and build frontend
if [ -d "frontend" ]; then
    echo "===== Building Frontend ====="
    cd frontend
    
    # Install frontend dependencies
    echo "Installing frontend dependencies..."
    if [ -f "package.json" ]; then
        echo "Found package.json, installing dependencies..."
        npm install --no-save || echo "Warning: npm install failed, continuing anyway"
        
        # Install specific dependencies that might be missing
        echo "Installing additional dependencies..."
        npm install --no-save antd prop-types redux-persist @ant-design/icons || echo "Warning: Installing additional dependencies failed"
        
        # Build frontend
        echo "Building frontend application..."
        npm run build || echo "Warning: Frontend build failed, continuing anyway"
        
        # Check if build was successful
        if [ -d "dist" ]; then
            echo "Frontend build successful."
            
            # Go back to root and copy frontend build to static directory
            cd /opt/render/project/src
            echo "Copying frontend build to backend/static..."
            mkdir -p backend/static
            cp -r frontend/dist/* backend/static/ || echo "Warning: Failed to copy frontend build to static directory"
            
            echo "Frontend build deployed to static directory."
        else
            echo "WARNING: Frontend build directory not found."
            cd /opt/render/project/src
        fi
    else
        echo "WARNING: No package.json found in frontend directory."
        cd /opt/render/project/src
    fi
else
    echo "WARNING: No frontend directory found."
fi

# Verify backend static directory
echo "Checking static directory..."
if [ -d "backend/static" ]; then
    echo "Static directory exists"
    echo "Contents:"
    ls -la backend/static | head -n 10
else
    echo "WARNING: Static directory not found in backend, creating it"
    mkdir -p backend/static
    echo "<html><body><h1>Harmonic Universe</h1><p>Static files not found.</p></body></html>" > backend/static/index.html
fi

# Verify database connection
echo "Checking database connection..."
if [ -n "$DATABASE_URL" ]; then
    echo "Database URL found: ${DATABASE_URL:0:10}..."
    
    # Run any pending migrations
    echo "Running any pending database migrations..."
    cd backend
    if [ -f "init_migrations.py" ]; then
        export FLASK_APP=init_migrations.py
        python -m flask db upgrade || echo "Warning: Migrations failed, but continuing"
    fi
    cd ..
else
    echo "WARNING: No DATABASE_URL found. Using SQLite."
fi

# Create/update wsgi.py file
echo "Updating WSGI entry point..."
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
print(f"Environment: {os.environ.get('FLASK_ENV', 'not set')}")
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

# Configure Flask to serve the React app
from flask import send_from_directory

# Path to the React build directory
react_build_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'frontend', 'dist')
static_path = os.path.join(os.path.dirname(__file__), 'static')

print(f"React build path: {react_build_path}")
print(f"Static path: {static_path}")
print(f"React build exists: {os.path.exists(react_build_path)}")
print(f"Static exists: {os.path.exists(static_path)}")

# Override any existing routes for the root URL
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve_react_app(path):
    # First try the path in the React build directory
    if path and os.path.exists(os.path.join(react_build_path, path)):
        print(f"Serving file from React build: {path}")
        return send_from_directory(react_build_path, path)
    # Then try the static directory
    elif path and os.path.exists(os.path.join(static_path, path)):
        print(f"Serving file from static: {path}")
        return send_from_directory(static_path, path)
    # Finally, serve index.html from React build or static
    else:
        if os.path.exists(os.path.join(react_build_path, 'index.html')):
            print(f"Serving index.html from React build")
            return send_from_directory(react_build_path, 'index.html')
        elif os.path.exists(os.path.join(static_path, 'index.html')):
            print(f"Serving index.html from static")
            return send_from_directory(static_path, 'index.html')
        else:
            print(f"No index.html found, serving minimal response")
            return "Harmonic Universe - No frontend files found"

# For gunicorn
application = app
EOF

# Start the application with Gunicorn
echo "Starting Gunicorn server..."
echo "Using backend.wsgi:application for Gunicorn"
cd /opt/render/project/src
exec gunicorn --bind 0.0.0.0:$PORT --log-level debug backend.wsgi:application 