#!/bin/bash
set -e

# Determine the correct directory structure
if [ -d "backend" ]; then
    BACKEND_DIR="backend"
    echo "Found backend directory at ./backend"
else
    BACKEND_DIR="."
    echo "Using current directory as backend directory"
fi

# Make sure Python can find our modules
export PYTHONPATH="$PYTHONPATH:$(pwd):$(pwd)/${BACKEND_DIR}"

# Verify frontend build static files
STATIC_DIRS=("${BACKEND_DIR}/static" "frontend/dist" "static")
STATIC_DIR=""

# Find the first valid static directory
for dir in "${STATIC_DIRS[@]}"; do
    if [ -d "$dir" ]; then
        STATIC_DIR="$dir"
        echo "Found static files directory at $dir"
        break
    fi
done

if [ -z "$STATIC_DIR" ]; then
    echo "WARNING: No static directory found! Creating one..."
    mkdir -p "${BACKEND_DIR}/static"
    STATIC_DIR="${BACKEND_DIR}/static"
fi

# Ensure static directory exists and has the React app
echo "Setting up static files for production..."

# Check if we have an index.html file in the static directory
if [ ! -f "${STATIC_DIR}/index.html" ]; then
    echo "WARNING: No index.html found in static directory! Creating a minimal React app..."
    
    # Create a minimal React app
    cat > "${STATIC_DIR}/index.html" <<EOL
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <script crossorigin src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script crossorigin src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
        body, html { margin: 0; padding: 0; font-family: Arial, sans-serif; }
        #root { min-height: 100vh; }
        .app {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
            background: linear-gradient(135deg, #1a237e 0%, #283593 100%);
            color: white;
        }
        .header {
            padding: 20px;
            background-color: rgba(0, 0, 0, 0.2);
            text-align: center;
        }
        .content {
            flex: 1;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            padding: 20px;
            text-align: center;
        }
        .footer {
            padding: 10px;
            background-color: rgba(0, 0, 0, 0.3);
            text-align: center;
            font-size: 0.8rem;
        }
        h1 { margin-bottom: 10px; }
        p { max-width: 600px; line-height: 1.6; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/javascript">
        const { useState, useEffect } = React;
        
        // Simple App component
        function App() {
            const [universes, setUniverses] = useState([]);
            const [loading, setLoading] = useState(true);
            
            useEffect(() => {
                // Simulate loading data
                const timer = setTimeout(() => {
                    setUniverses([
                        { id: 1, name: 'Harmonic Universe 1', description: 'A universe of musical harmony' },
                        { id: 2, name: 'Rhythmic Cosmos', description: 'Exploring rhythmic patterns in space' },
                        { id: 3, name: 'Melodic Dimension', description: 'A dimension of pure melody' }
                    ]);
                    setLoading(false);
                }, 1000);
                
                return () => clearTimeout(timer);
            }, []);
            
            return React.createElement('div', { className: 'app' },
                React.createElement('header', { className: 'header' },
                    React.createElement('h1', null, 'Harmonic Universe')
                ),
                React.createElement('main', { className: 'content' },
                    loading ? 
                    React.createElement('p', null, 'Loading universes...') :
                    React.createElement('div', null,
                        React.createElement('h2', null, 'Your Musical Universes'),
                        React.createElement('p', null, 'Explore the harmony of the cosmos through these musical universes'),
                        universes.map(universe => 
                            React.createElement('div', { key: universe.id, style: { margin: '10px', padding: '15px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '5px' } },
                                React.createElement('h3', null, universe.name),
                                React.createElement('p', null, universe.description)
                            )
                        )
                    )
                ),
                React.createElement('footer', { className: 'footer' },
                    React.createElement('p', null, '© ' + new Date().getFullYear() + ' Harmonic Universe')
                )
            );
        }
        
        // Render the app
        const rootNode = document.getElementById('root');
        const root = ReactDOM.createRoot(rootNode);
        root.render(React.createElement(App));
    </script>
</body>
</html>
EOL
fi

# Change to the backend directory
cd $BACKEND_DIR

# Update pip if needed
echo "Updating pip..."
python -m pip install --upgrade pip

# Make sure Flask is installed
echo "Ensuring Flask is installed..."
python -m pip install flask flask-login flask-sqlalchemy flask-migrate flask-cors || {
    echo "Failed to install Flask with python -m pip, trying alternatives..."
    pip install flask flask-login flask-sqlalchemy flask-migrate flask-cors
}

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
    fi
fi

# Make sure Python can find our modules
echo "Setting PYTHONPATH to include $(pwd) and $(dirname $(pwd))"
export PYTHONPATH="$PYTHONPATH:$(pwd):$(dirname $(pwd))"

# Set environment variables for production
export FLASK_ENV=production
export FLASK_APP=wsgi:app

# Create a minimal wsgi.py file if it doesn't exist
if [ ! -f "wsgi.py" ]; then
    echo "WARNING: No wsgi.py found! Creating a minimal one..."
    cat > wsgi.py <<EOL
#!/usr/bin/env python
"""
WSGI entry point for Harmonic Universe backend
"""

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add current directory to Python path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Create Flask app
from flask import Flask, send_from_directory

def create_app():
    """Create a minimal Flask application that serves the React frontend"""
    # Find static folder
    static_folder = None
    for path in ['static', '../frontend/dist', '../static']:
        if os.path.exists(os.path.join(os.path.dirname(__file__), path)):
            static_folder = os.path.join(os.path.dirname(__file__), path)
            break
    
    if not static_folder:
        static_folder = os.path.join(os.path.dirname(__file__), 'static')
        if not os.path.exists(static_folder):
            os.makedirs(static_folder)
    
    app = Flask(__name__, static_folder=static_folder, static_url_path='')
    
    @app.route('/', defaults={'path': ''})
    @app.route('/<path:path>')
    def serve(path):
        if path and os.path.exists(os.path.join(static_folder, path)):
            return send_from_directory(static_folder, path)
        else:
            return send_from_directory(static_folder, 'index.html')
    
    return app

app = create_app()

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
EOL
    chmod +x wsgi.py
fi

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