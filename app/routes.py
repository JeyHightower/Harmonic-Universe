from flask import Blueprint, jsonify, current_app, send_from_directory
import os

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
    return send_from_directory(current_app.static_folder, 'index.html')

@main_bp.route('/favicon.ico')
def favicon():
    """Serve the favicon file"""
    return send_from_directory(current_app.static_folder, 'favicon.svg')

@main_bp.route('/<path:path>')
def serve_static(path):
    """Serve any static files"""
    current_app.logger.info(f"Requested static file: {path}")
    # If path starts with assets, we need to serve from assets subdirectory
    if path.startswith('assets/'):
        return send_from_directory(os.path.join(current_app.static_folder, 'assets'), path[7:])
    return send_from_directory(current_app.static_folder, path)
