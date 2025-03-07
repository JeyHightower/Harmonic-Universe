from flask import Blueprint, jsonify, current_app, send_from_directory, abort, make_response
import os
import logging

# Configure logger
logger = logging.getLogger(__name__)

# Create a main routes blueprint
main_bp = Blueprint('main', __name__)

@main_bp.route('/api')
def api_index():
    """API root endpoint"""
    return jsonify({'message': 'Welcome to Harmonic Universe API'})

@main_bp.route('/api/health')
def health():
    """Health check endpoint"""
    from app import db
    # Check database connection
    db_health = "healthy"
    db_error = None
    try:
        db.engine.execute("SELECT 1")
    except Exception as e:
        db_health = "unhealthy"
        db_error = str(e)

    return jsonify({
        'status': 'healthy',
        'database': db_health,
        'database_error': db_error
    })

# Static file routes
@main_bp.route('/')
def index():
    """Serve the main index.html file"""
    current_app.logger.info("Serving root index.html")
    static_folder = current_app.static_folder
    current_app.logger.info(f"Static folder path: {static_folder}")

    # Check if index.html exists and log its presence
    index_path = os.path.join(static_folder, 'index.html')
    if os.path.exists(index_path):
        current_app.logger.info(f"index.html found at {index_path}")

        # Read the file content and return it directly
        try:
            with open(index_path, 'r') as f:
                content = f.read()
                response = make_response(content)
                response.headers['Content-Type'] = 'text/html'
                current_app.logger.info(f"Returning index.html with {len(content)} bytes")
                return response
        except Exception as e:
            current_app.logger.error(f"Error reading index.html: {str(e)}")
    else:
        current_app.logger.warning(f"index.html NOT found at {index_path}")
        # List files in static folder for debugging
        if os.path.exists(static_folder):
            current_app.logger.info(f"Files in static folder: {os.listdir(static_folder)}")
        else:
            current_app.logger.error(f"Static folder not found at: {static_folder}")

    # Fallback - create a simple HTML page
    html = """<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; }
        h1 { color: #333; }
        .container { max-width: 800px; margin: 0 auto; }
        .error { color: red; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Harmonic Universe</h1>
        <p>Application is running, but there was an issue serving the index.html file.</p>
        <p>This is a dynamically generated fallback page.</p>
        <div id="api-status">Checking API status...</div>
    </div>
    <script>
        fetch('/api/health')
            .then(response => response.json())
            .then(data => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:' + (data.status === 'healthy' ? 'green' : 'red') + '">' + data.status + '</span>';
            })
            .catch(error => {
                document.getElementById('api-status').innerHTML =
                    'API Status: <span style="color:red">Connection Failed</span>';
            });
    </script>
</body>
</html>
"""
    response = make_response(html)
    response.headers['Content-Type'] = 'text/html'
    current_app.logger.info("Returning fallback HTML with 200 status")
    return response

@main_bp.route('/favicon.ico')
def favicon():
    """Serve the favicon file"""
    static_folder = current_app.static_folder
    # Try both favicon.ico and favicon.svg
    if os.path.exists(os.path.join(static_folder, 'favicon.ico')):
        return send_from_directory(static_folder, 'favicon.ico')
    elif os.path.exists(os.path.join(static_folder, 'favicon.svg')):
        return send_from_directory(static_folder, 'favicon.svg')
    else:
        current_app.logger.warning("Favicon not found")
        abort(404)

@main_bp.route('/<path:path>')
def serve_static(path):
    """Serve any static files"""
    current_app.logger.info(f"Requested static file: {path}")
    static_folder = current_app.static_folder

    # Handle the common case of assets/ path
    if path.startswith('assets/'):
        assets_path = os.path.join(static_folder, 'assets')
        file_path = os.path.join(assets_path, path[7:])
        if os.path.exists(file_path):
            current_app.logger.info(f"Serving asset from: {file_path}")
            return send_from_directory(assets_path, path[7:])
        else:
            current_app.logger.warning(f"Asset not found: {file_path}")

    # For all other paths, try to serve directly from static folder
    file_path = os.path.join(static_folder, path)
    if os.path.exists(file_path):
        current_app.logger.info(f"Serving file from: {file_path}")

        # For JavaScript and CSS files, read and return directly
        if path.endswith('.js') or path.endswith('.css'):
            try:
                with open(file_path, 'r') as f:
                    content = f.read()
                    response = make_response(content)
                    if path.endswith('.js'):
                        response.headers['Content-Type'] = 'application/javascript'
                    else:
                        response.headers['Content-Type'] = 'text/css'
                    current_app.logger.info(f"Returning {path} with {len(content)} bytes")
                    return response
            except Exception as e:
                current_app.logger.error(f"Error reading {path}: {str(e)}")

        # For other files, use send_from_directory
        return send_from_directory(static_folder, path)
    else:
        current_app.logger.warning(f"File not found: {file_path}")

    # If we get here, file wasn't found
    abort(404)
