from flask import Blueprint, jsonify, current_app, send_from_directory, abort
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
    else:
        current_app.logger.warning(f"index.html NOT found at {index_path}")
        # List files in static folder for debugging
        if os.path.exists(static_folder):
            current_app.logger.info(f"Files in static folder: {os.listdir(static_folder)}")
        else:
            current_app.logger.error(f"Static folder not found at: {static_folder}")

    try:
        return send_from_directory(static_folder, 'index.html')
    except Exception as e:
        current_app.logger.error(f"Error serving index.html: {str(e)}")
        # Create and return a simple fallback response
        return f"""
        <!DOCTYPE html>
        <html>
        <head>
            <title>Harmonic Universe</title>
            <style>
                body {{ font-family: Arial, sans-serif; margin: 40px; }}
                .error {{ color: red; }}
            </style>
        </head>
        <body>
            <h1>Harmonic Universe</h1>
            <p>The application is running, but there was an error serving the main page.</p>
            <p class="error">Error: {str(e)}</p>
            <p>Static folder: {static_folder}</p>
            <p>Current directory: {os.getcwd()}</p>
        </body>
        </html>
        """, 200

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
        return send_from_directory(static_folder, path)
    else:
        current_app.logger.warning(f"File not found: {file_path}")

    # If we get here, file wasn't found
    abort(404)
