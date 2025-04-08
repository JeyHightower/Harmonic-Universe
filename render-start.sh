#!/bin/bash
set -e

# Make sure Python can find our modules
export PYTHONPATH="$PYTHONPATH:$(pwd):$(pwd)/backend"

# Verify frontend build exists
if [ -d "frontend/dist" ]; then
    echo "Frontend build found at frontend/dist"
else
    echo "WARNING: No frontend build found in frontend/dist! Backend may not be able to serve the frontend."
fi

# Ensure static directory exists and has the React app
echo "Setting up static files for production..."
mkdir -p backend/static

# Copy frontend files if they exist
if [ -d "frontend/dist" ] && [ "$(ls -A frontend/dist)" ]; then
    echo "Copying frontend files to backend/static..."
    cp -r frontend/dist/* backend/static/
fi

# Check if we have an index.html file in the static directory
if [ ! -f "backend/static/index.html" ]; then
    echo "WARNING: No index.html found in backend/static! Creating a minimal React app..."
    
    # Create a minimal React app
    cat > backend/static/index.html <<EOL
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

cd backend

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