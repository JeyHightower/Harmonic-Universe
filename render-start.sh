#!/bin/bash

# Exit on error
set -e

echo "Starting Harmonic Universe application"
echo "Current directory: $(pwd)"
echo "Python version: $(python --version)"

# Set environment variables
export FLASK_APP=wsgi.py
export FLASK_ENV=production
export FLASK_DEBUG=0
export PYTHONPATH=$(pwd):$PYTHONPATH

# Set CORS environment variables for API requests
export CORS_ORIGINS="https://harmonic-universe.onrender.com,https://harmonic-universe-z5ka.onrender.com,*"
export CORS_SUPPORTS_CREDENTIALS=true

# Enhanced logging
if [ "${ENABLE_DETAILED_LOGGING}" = "true" ]; then
    echo "Detailed logging enabled"
    export PYTHONUNBUFFERED=1
    export LOG_LEVEL=DEBUG
    # Create logs directory if it doesn't exist
    mkdir -p logs
fi

# Determine the port to use
PORT="${PORT:-10000}"
echo "Application will listen on port $PORT"

# Check all possible static directory locations
echo "Checking static directories..."
static_dirs=("./static" "./backend/static" "/opt/render/project/src/static" "/opt/render/project/src/backend/static")
static_found=false

for dir in "${static_dirs[@]}"; do
    if [ -d "$dir" ]; then
        echo "Found static directory at: $dir"
        echo "Contents:"
        ls -la "$dir" | head -n 10
        
        # Verify index.html exists
        if [ -f "$dir/index.html" ]; then
            echo "index.html found in $dir"
            static_found=true
        else
            echo "WARNING: index.html not found in $dir"
        fi
    else
        echo "Static directory not found at: $dir"
    fi
done

# If no static directory with index.html was found, create a basic one
if [ "$static_found" = false ]; then
    echo "WARNING: No valid static directory found with index.html, creating one"
    mkdir -p static
    
    # Create a basic index.html with CDN links to React
    cat > static/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe</title>
    <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; }
        .container { max-width: 800px; margin: 0 auto; }
    </style>
</head>
<body>
    <div id="root">
        <div class="container">
            <h1>Harmonic Universe</h1>
            <p>Loading application...</p>
        </div>
    </div>
    <script src="/index.js"></script>
</body>
</html>
EOF

    # Create a basic index.js that will load when the app starts
    cat > static/index.js << 'EOF'
console.log('Fallback index.js loaded');

// Check if React and ReactDOM are loaded
if (window.React && window.ReactDOM) {
    console.log('React libraries loaded successfully');
    
    const App = () => {
        const [status, setStatus] = React.useState('Checking API...');
        
        React.useEffect(() => {
            fetch('/api/health')
                .then(res => res.json())
                .then(data => {
                    console.log('API response:', data);
                    setStatus('API Status: ' + JSON.stringify(data));
                })
                .catch(err => {
                    console.error('API error:', err);
                    setStatus('Error connecting to API: ' + err.message);
                });
        }, []);
        
        return React.createElement('div', {className: 'container'}, [
            React.createElement('h1', {key: 'title'}, 'Harmonic Universe'),
            React.createElement('p', {key: 'status'}, status),
            React.createElement('p', {key: 'note'}, 'This is a fallback page.')
        ]);
    };
    
    const root = document.getElementById('root');
    if (root) {
        ReactDOM.createRoot(root).render(React.createElement(App));
    }
} else {
    console.error('React libraries not loaded!');
    document.getElementById('root').innerHTML = `
        <div class="container">
            <h1>Harmonic Universe</h1>
            <p>Error: React libraries failed to load</p>
            <p>Please check the console for more information.</p>
        </div>
    `;
}
EOF

    # Copy files to backend/static as well for redundancy
    mkdir -p backend/static
    cp static/index.html backend/static/
    cp static/index.js backend/static/
fi

# Create diagnostic.html file to help troubleshoot issues
echo "Creating diagnostic tool..."
cat > static/diagnostic.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Harmonic Universe Diagnostics</title>
    <style>
        body { font-family: sans-serif; margin: 0; padding: 20px; line-height: 1.6; }
        .container { max-width: 800px; margin: 0 auto; }
        .card { background: #f5f5f5; border-radius: 8px; padding: 15px; margin-bottom: 20px; }
        .success { color: green; }
        .error { color: red; }
        pre { background: #eee; padding: 10px; overflow: auto; }
        button { padding: 8px 16px; background: #0366d6; color: white; border: none; border-radius: 4px; cursor: pointer; }
        button:hover { background: #0056b3; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe Diagnostic Page</h1>
        <div class="card">
            <h2>Environment</h2>
            <pre id="environment">Loading...</pre>
        </div>
        <div class="card">
            <h2>API Status</h2>
            <div id="api-status">Checking...</div>
        </div>
        <div class="card">
            <h2>Static Files</h2>
            <div id="static-files">Checking...</div>
        </div>
        <div class="card">
            <h2>Debug Information</h2>
            <pre id="debug-info">Loading...</pre>
        </div>
        <div class="card">
            <h2>Errors</h2>
            <div id="errors"></div>
        </div>
        <button id="refresh">Refresh Tests</button>
    </div>
    
    <script>
        // Environment information
        function getEnvironmentInfo() {
            const env = {
                userAgent: navigator.userAgent,
                location: window.location.href,
                protocol: window.location.protocol,
                timestamp: new Date().toISOString(),
                screenSize: `${window.innerWidth}x${window.innerHeight}`,
                languages: navigator.languages,
                cookiesEnabled: navigator.cookieEnabled,
                localStorage: !!window.localStorage,
                sessionStorage: !!window.sessionStorage,
                serviceWorker: 'serviceWorker' in navigator
            };
            document.getElementById('environment').textContent = JSON.stringify(env, null, 2);
        }
        
        // Check API status
        async function checkApiStatus() {
            const apiStatus = document.getElementById('api-status');
            try {
                const response = await fetch('/api/health');
                const data = await response.json();
                apiStatus.innerHTML = `<span class="success">✅ API is responsive: ${JSON.stringify(data)}</span>`;
            } catch (error) {
                apiStatus.innerHTML = `<span class="error">❌ API error: ${error.message}</span>`;
            }
        }
        
        // Check static files
        async function checkStaticFiles() {
            const staticFiles = document.getElementById('static-files');
            const filesToCheck = [
                '/assets/index.js',
                '/assets/index-YhiCDp85.css',
                '/js/main.js',
                '/static/index.js',
                '/index.js',
                '/css2',
                '/ajax/libs/font-awesome/6.4.0/css/all.min.css'
            ];
            
            let results = '';
            
            for (const file of filesToCheck) {
                try {
                    const response = await fetch(file);
                    if (response.ok) {
                        results += `<div><span class="success">✅ Found: ${file}</span></div>`;
                    } else {
                        results += `<div><span class="error">❌ Not found: ${file}</span></div>`;
                    }
                } catch (error) {
                    results += `<div><span class="error">❌ Error checking ${file}: ${error.message}</span></div>`;
                }
            }
            
            staticFiles.innerHTML = results;
        }
        
        // Get debug info from API
        async function getDebugInfo() {
            const debugInfo = document.getElementById('debug-info');
            try {
                const response = await fetch('/api/debug/static');
                const data = await response.json();
                debugInfo.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                const errElement = document.getElementById('errors');
                errElement.innerHTML += `<div class="error">❌ Failed to load debug info: ${error.message}</div>`;
                debugInfo.textContent = "Error fetching debug information";
            }
        }
        
        // Run all tests
        function runDiagnostics() {
            getEnvironmentInfo();
            checkApiStatus();
            checkStaticFiles();
            getDebugInfo();
        }
        
        // Initial run
        runDiagnostics();
        
        // Refresh button
        document.getElementById('refresh').addEventListener('click', runDiagnostics);
    </script>
</body>
</html>
EOF

# Copy diagnostic to backend/static as well
cp static/diagnostic.html backend/static/

# Run database health check
echo "Running database health check..."
python -c "
try:
    import sys
    sys.path.insert(0, '.')
    from backend.app.extensions import db
    from backend.app import create_app
    app = create_app()
    with app.app_context():
        with db.engine.connect() as conn:
            result = conn.execute(db.text('SELECT 1'))
            print('Database connection successful')
except Exception as e:
    print(f'Database connection error: {str(e)}')
    exit(1)
" || echo "Warning: Database check failed, continuing anyway"

# Run database migrations if needed
if [ -f "init_migrations.py" ]; then
    echo "Running database migrations..."
    python init_migrations.py || echo "Warning: Migrations failed, continuing anyway"
fi

# Start the application with gunicorn
echo "Starting application with gunicorn..."
gunicorn --workers=2 --timeout=120 --bind=0.0.0.0:$PORT --log-level ${LOG_LEVEL:-info} wsgi:app