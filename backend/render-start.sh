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

# Set up app module wrapper
if [ -f "app_module_wrapper.py" ]; then
    echo "Setting up app module wrapper..."
    python app_module_wrapper.py || echo "Warning: App module wrapper setup failed, continuing anyway"
else
    echo "Creating app module wrapper..."
    cat > app_module_wrapper.py << 'EOF'
"""
This file creates a package structure to make app.extensions accessible
by redirecting imports to backend.app
"""
import os
import sys
import importlib.util
import importlib.machinery
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class AppFinder:
    """
    Meta path finder that redirects 'app' imports to 'backend.app'
    """
    @classmethod
    def find_spec(cls, fullname, path=None, target=None):
        # Only handle 'app' and its submodules
        if not fullname.startswith('app'):
            return None
        
        logger.info(f"AppFinder: Finding spec for {fullname}")
        
        # Convert 'app.xyz' to 'backend.app.xyz'
        backend_name = 'backend.' + fullname
        
        try:
            # Try to find the spec for the backend module
            spec = importlib.util.find_spec(backend_name)
            if spec:
                logger.info(f"AppFinder: Found spec for {backend_name}")
                return spec
        except (ImportError, AttributeError) as e:
            logger.warning(f"AppFinder: Error finding spec for {backend_name}: {e}")
        
        logger.warning(f"AppFinder: Could not find spec for {fullname} -> {backend_name}")
        return None

class AppLoader:
    """
    Loader that redirects 'app' imports to 'backend.app'
    """
    @classmethod
    def create_module(cls, spec):
        # Use the default module creation
        return None
    
    @classmethod
    def exec_module(cls, module):
        # Get the module name without 'app.'
        if module.__name__ == 'app':
            backend_name = 'backend.app'
        else:
            backend_name = 'backend.' + module.__name__
        
        logger.info(f"AppLoader: Executing module {module.__name__} -> {backend_name}")
        
        try:
            # Import the backend module
            backend_module = importlib.import_module(backend_name)
            
            # Copy all attributes from the backend module to this module
            for attr_name in dir(backend_module):
                if not attr_name.startswith('__'):
                    setattr(module, attr_name, getattr(backend_module, attr_name))
            
            logger.info(f"AppLoader: Successfully loaded {backend_name} into {module.__name__}")
        except (ImportError, AttributeError) as e:
            logger.error(f"AppLoader: Failed to load {backend_name}: {e}")
            raise ImportError(f"Cannot load {module.__name__} from {backend_name}: {e}")

# Create a package structure
def setup_app_package():
    """Set up the app package structure with appropriate __init__.py files"""
    app_dir = os.path.join(os.path.dirname(__file__), 'app')
    
    # Create app directory if it doesn't exist
    if not os.path.exists(app_dir):
        os.makedirs(app_dir)
        logger.info(f"Created app directory: {app_dir}")
    
    # Create app/__init__.py
    init_path = os.path.join(app_dir, '__init__.py')
    if not os.path.exists(init_path):
        with open(init_path, 'w') as f:
            f.write("""# This file redirects imports to backend.app
import sys
from importlib import import_module

# Import everything from backend.app
try:
    backend_app = import_module('backend.app')
    for attr_name in dir(backend_app):
        if not attr_name.startswith('__'):
            globals()[attr_name] = getattr(backend_app, attr_name)
except ImportError as e:
    print(f"Error importing backend.app: {e}")
""")
        logger.info(f"Created app/__init__.py: {init_path}")
    
    # Create app/extensions directory and __init__.py
    extensions_dir = os.path.join(app_dir, 'extensions')
    if not os.path.exists(extensions_dir):
        os.makedirs(extensions_dir)
        logger.info(f"Created extensions directory: {extensions_dir}")
    
    # Create app/extensions/__init__.py
    ext_init_path = os.path.join(extensions_dir, '__init__.py')
    if not os.path.exists(ext_init_path):
        with open(ext_init_path, 'w') as f:
            f.write("""# This file redirects imports to backend.app.extensions
import sys
from importlib import import_module

# Import everything from backend.app.extensions
try:
    backend_extensions = import_module('backend.app.extensions')
    for attr_name in dir(backend_extensions):
        if not attr_name.startswith('__'):
            globals()[attr_name] = getattr(backend_extensions, attr_name)
except ImportError as e:
    print(f"Error importing backend.app.extensions: {e}")
""")
        logger.info(f"Created app/extensions/__init__.py: {ext_init_path}")

# Register our custom import finder
def install_import_hook():
    """Install the import hook to redirect app.* imports to backend.app.*"""
    sys.meta_path.insert(0, AppFinder)
    logger.info("Installed app import hook")

# Only run this when executed directly
if __name__ == "__main__":
    setup_app_package()
    install_import_hook()
    logger.info("App module wrapper setup complete")
EOF
    python app_module_wrapper.py || echo "Warning: App module wrapper setup failed, continuing anyway"
fi

# Check backend/app.py file for extensions
if [ -f "backend/app.py" ]; then
    echo "Checking backend/app.py for extensions..."
    if ! grep -q "extensions" backend/app.py; then
        # Create extensions directory in backend/app
        mkdir -p backend/app/extensions
        
        # Create an __init__.py file in the extensions directory
        if [ ! -f "backend/app/extensions/__init__.py" ]; then
            echo "Creating backend/app/extensions/__init__.py..."
            cat > backend/app/extensions/__init__.py << 'EOF'
# Extensions module for the Flask application
# This file can be imported as "app.extensions" or "backend.app.extensions"

from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_bcrypt import Bcrypt
from flask_jwt_extended import JWTManager

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
bcrypt = Bcrypt()
jwt = JWTManager()

def init_app(app):
    """Initialize all extensions with the app"""
    db.init_app(app)
    migrate.init_app(app, db)
    bcrypt.init_app(app)
    jwt.init_app(app)
    
    return app
EOF
        fi
    fi
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
        npm install --no-save antd@4.24.10 prop-types@15.8.1 redux-persist@6.0.0 @ant-design/icons@4.8.0 react-router-dom@6.10.0 --legacy-peer-deps || echo "Warning: Installing additional dependencies failed"
        
        # Install visualization libraries
        echo "Installing visualization libraries..."
        npm install --no-save three@0.155.0 tone@14.7.77 || echo "Warning: Installing visualization libraries failed"
        
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