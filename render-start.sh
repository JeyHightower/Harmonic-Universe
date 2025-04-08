#!/bin/bash
set -e

cd backend

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

# Check if gunicorn is working properly
GUNICORN_PATH=$(which gunicorn 2>/dev/null || echo "")
if [ -n "$GUNICORN_PATH" ]; then
    echo "Using gunicorn at: $GUNICORN_PATH"
    
    # Start the Flask application with gunicorn
    echo "Starting Flask application with gunicorn..."
    exec gunicorn wsgi:app
else
    echo "Falling back to direct Flask execution..."
    # Use Flask's built-in server as a fallback
    export FLASK_APP=wsgi:app
    export FLASK_ENV=production
    exec python -m flask run --host=0.0.0.0 --port=${PORT:-5000}
fi