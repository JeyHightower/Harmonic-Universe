#!/bin/bash
set -e

# Make sure Python can find our modules
export PYTHONPATH="$PYTHONPATH:$(pwd):$(pwd)/backend"

# Run deployment script to ensure correct python environment
echo "Running deployment setup script..."
python render_deploy.py || {
    echo "WARNING: Deployment script failed, continuing with manual setup"
    
    # Make sure Flask is installed
    echo "Ensuring Flask is installed manually..."
    python -m pip install flask flask-login flask-sqlalchemy flask-migrate gunicorn
}

# Create symbolic links to ensure the static frontend is served properly
echo "Setting up static file links for production..."
if [ -d "frontend/dist" ]; then
    echo "Frontend build found at frontend/dist"
    # Create static folder if it doesn't exist
    mkdir -p backend/static
    # Link the frontend dist to backend static
    cp -r frontend/dist/* backend/static/ || echo "Failed to copy frontend assets to backend/static"
else
    echo "WARNING: No frontend build found at frontend/dist"
fi

cd backend

# Update pip if needed
echo "Updating pip..."
python -m pip install --upgrade pip

# Make sure Flask is installed
echo "Ensuring Flask is installed..."
python -m pip install flask flask-login flask-sqlalchemy flask-migrate flask-cors || {
    echo "Failed to install Flask with python -m pip, trying alternatives..."
    pip install flask flask-login flask-sqlalchemy flask-migrate flask-cors
    pip3 install flask flask-login flask-sqlalchemy flask-migrate flask-cors
}

# Verify Flask is installed properly
if python -c "import flask" 2>/dev/null; then
    echo "Flask successfully imported"
else
    echo "ERROR: Flask still cannot be imported!"
    echo "Python path: $(which python)"
    echo "Python version: $(python --version)"
    echo "PYTHONPATH: $PYTHONPATH"
    echo "Installed packages:"
    python -m pip list
    echo "Falling back to direct installation for Flask and dependencies..."
    pip install --force-reinstall flask werkzeug jinja2 itsdangerous click
fi

# Function to check if gunicorn is properly installed and executable
check_gunicorn() {
    echo "Checking for gunicorn in PATH..."
    which gunicorn && return 0
    
    # Check in common locations
    for path in /usr/local/bin /usr/bin ~/.local/bin $(python -m site --user-base)/bin; do
        echo "Checking $path for gunicorn..."
        if [ -x "$path/gunicorn" ]; then
            echo "Found gunicorn at $path/gunicorn"
            export PATH="$PATH:$path"
            return 0
        fi
    done
    
    return 1
}

# Ensure gunicorn is installed with the full pip path
if ! check_gunicorn; then
    echo "Gunicorn not found, installing..."
    python -m pip install gunicorn
    
    # Verify installation completed
    if ! check_gunicorn; then
        echo "Trying alternative installation methods..."
        pip3 install gunicorn
        pip install gunicorn
        
        # Add additional paths to PATH
        export PATH=$PATH:/usr/local/bin:$(python -m site --user-base)/bin:~/.local/bin
        
        # Check again
        if ! check_gunicorn; then
            echo "WARNING: Gunicorn installation failed or not in PATH!"
            echo "Python executable location: $(which python)"
            echo "Python version: $(python --version)"
            echo "Pip version: $(pip --version)"
            echo "Current PATH: $PATH"
            echo "Trying to find gunicorn in pip list..."
            pip list | grep gunicorn
            
            # Try a direct path approach
            GUNICORN_PATH=$(pip show gunicorn | grep Location | cut -d' ' -f2)
            if [ -n "$GUNICORN_PATH" ]; then
                echo "Gunicorn found at: $GUNICORN_PATH"
                export PYTHONPATH="$PYTHONPATH:$GUNICORN_PATH"
            fi
        fi
    fi
fi

# Verify that both Flask and the app module are importable
echo "Verifying application imports..."
python -c "import flask; print('Flask version:', flask.__version__)" || echo "WARNING: Flask import failed!"
python -c "import sys; print('Python sys.path:', sys.path)" || echo "WARNING: Cannot print sys.path!"

# Check if wsgi.py exists and its content
if [ -f "wsgi.py" ]; then
    echo "wsgi.py exists in the backend directory."
    echo "First few lines of wsgi.py:"
    head -n 10 wsgi.py
else
    echo "ERROR: wsgi.py not found in backend directory!"
    echo "Current directory: $(pwd)"
    echo "Directory contents:"
    ls -la
    
    # Check if it's in the parent directory
    if [ -f "../wsgi.py" ]; then
        echo "Found wsgi.py in the parent directory, using that instead."
        cd ..
        echo "Now in directory: $(pwd)"
    fi
fi

# Make sure Python can find our modules
echo "Setting PYTHONPATH to include $(pwd) and $(dirname $(pwd))"
export PYTHONPATH="$PYTHONPATH:$(pwd):$(dirname $(pwd))"

# Set environment variables for production
export FLASK_ENV=production
export FLASK_APP=wsgi:app

# Check if gunicorn is working properly
GUNICORN_PATH=$(which gunicorn 2>/dev/null || echo "")
if [ -n "$GUNICORN_PATH" ]; then
    echo "Using gunicorn at: $GUNICORN_PATH"
    
    # Start the Flask application with gunicorn
    echo "Starting Flask application with gunicorn..."
    exec gunicorn --bind 0.0.0.0:$PORT --workers=2 --threads=2 --timeout=60 wsgi:app
else
    echo "Falling back to direct Flask execution..."
    # Use Flask's built-in server as a fallback
    exec python -m flask run --host=0.0.0.0 --port=${PORT:-5000}
fi