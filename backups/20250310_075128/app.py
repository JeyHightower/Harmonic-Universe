"""
Direct Flask application entry point for Render.com.
This is a special app.py file that will be used by Gunicorn as the entry point.
"""
from flask import Flask, send_from_directory, jsonify, request
import os
import logging
import sys
from app import create_app
import datetime
import jwt

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout)
    ]
)

# Create Flask app
app = Flask(__name__, static_folder='static')

# Configure app for production
flask_env = os.environ.get('FLASK_ENV', 'production')
app.config['ENV'] = flask_env  # For backward compatibility
app.config['DEBUG'] = flask_env == 'development'

# Get CORS settings from environment variables
cors_origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# Enable CORS for all routes with more secure configuration
@app.after_request
def add_cors_headers(response):
    origin = request.headers.get('Origin')

    # Check if the request origin is allowed
    if origin and any(origin == allowed_origin for allowed_origin in cors_origins):
        response.headers.add('Access-Control-Allow-Origin', origin)
        response.headers.add('Access-Control-Allow-Credentials', 'true')
        response.headers.add('Access-Control-Allow-Headers',
                             'Content-Type,Authorization,X-Requested-With,Accept')
        response.headers.add('Access-Control-Allow-Methods',
                             'GET,POST,PUT,DELETE,PATCH,OPTIONS')
        response.headers.add('Access-Control-Expose-Headers',
                             'Content-Length,Content-Type')
        response.headers.add('Access-Control-Max-Age', '600')  # 10 minutes

    return response

# Health check endpoint
@app.route('/health')
def health_check():
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'version': '1.0.4',
        'environment': app.config.get('ENV')
    })

# API endpoint for debugging
@app.route('/api/debug')
def debug_info():
    return jsonify({
        'server_time': datetime.now().isoformat(),
        'environment': app.config.get('ENV'),
        'static_folder': app.static_folder,
        'request_headers': dict(request.headers),
        'python_version': sys.version,
        'flask_version': Flask.__version__
    })

# API endpoint to verify the backend is working
@app.route('/api/ping')
def ping():
    return jsonify({
        'message': 'pong',
        'time': datetime.now().isoformat()
    })

@app.route('/')
def serve_index():
    try:
        # Try to find the index.html in the static build directory
        index_path = os.path.join(app.static_folder, 'index.html')

        # If not found there, try the fallback
        if not os.path.exists(index_path):
            index_path = os.path.join(os.getcwd(), 'static', 'index.html')

        if os.path.exists(index_path):
            with open(index_path, 'rb') as f:
                content = f.read()

            response = app.response_class(
                response=content,
                status=200,
                mimetype='text/html'
            )
            response.headers['Content-Length'] = str(len(content))

            # Add cache-busting headers for index.html
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'

            logging.info(f"Successfully served index.html ({len(content)} bytes)")
            return response
        else:
            logging.error("Cannot find index.html in any static directory")
            return "Index file not found", 404
    except Exception as e:
        logging.error(f"Error serving index.html: {e}")
        return f"Error: {str(e)}", 500

# Serve static files from the static directory
@app.route('/<path:filename>')
def serve_static(filename):
    logging.info(f"Serving static file: {filename}")
    response = send_from_directory(app.static_folder, filename)

    # Add cache-busting headers for JS and CSS files
    if filename.endswith(('.js', '.css')):
        # No-cache for development, short cache for production
        if app.config.get('ENV') == 'development':
            response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response.headers['Pragma'] = 'no-cache'
            response.headers['Expires'] = '0'
        else:
            # In production, cache for 1 hour but require revalidation
            response.headers['Cache-Control'] = 'public, max-age=3600, must-revalidate'

    # For index.html, always set no-cache
    elif filename == 'index.html':
        response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response.headers['Pragma'] = 'no-cache'
        response.headers['Expires'] = '0'

    return response

# Catch all routes and serve index.html for client-side routing
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    # Log the request for debugging
    logging.info(f"Catch-all route hit for path: {path}")

    # If requesting a specific file extension, try to serve it directly
    if '.' in path:
        try:
            return send_from_directory(app.static_folder, path)
        except:
            logging.warning(f"File not found: {path}")

    # For SPA routes, serve the index.html
    logging.info(f"Serving index.html for SPA route: {path}")
    response = send_from_directory(app.static_folder, 'index.html')

    # Add cache control headers for SPA routes
    response.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'

    return response

# Error handlers
@app.errorhandler(404)
def page_not_found(e):
    logging.warning(f"404 error: {request.path}")
    return send_from_directory(app.static_folder, 'index.html')

@app.errorhandler(500)
def server_error(e):
    logging.error(f"500 error: {str(e)}")
    return jsonify({"error": "Internal Server Error", "message": str(e)}), 500

# Create and expose the Flask application
application = create_app()
app = application  # Alias for compatibility

# Main entrypoint
if __name__ == '__main__':
    # Get port from environment variable or default to 8000 to avoid conflicts with AirPlay on macOS
    port = int(os.environ.get('PORT', 8000))

    # Ensure the static folder exists
    os.makedirs(app.static_folder, exist_ok=True)

    # Check if we have index.html
    index_path = os.path.join(app.static_folder, 'index.html')
    if not os.path.exists(index_path):
        logging.warning(f"index.html not found at {index_path}")
    else:
        logging.info(f"index.html found at {index_path} ({os.path.getsize(index_path)} bytes)")

    # Log startup info
    logging.info(f"Starting Flask app in {app.config.get('ENV', 'production')} mode")
    logging.info(f"Static folder: {app.static_folder}")

    # Run the app
    app.run(host='0.0.0.0', port=port)

@app.route('/debug/static-info')
def static_info():
    """Debug endpoint to check static files"""
    import os
    from flask import jsonify

    static_dir = app.static_folder
    files = []

    for root, dirs, filenames in os.walk(static_dir):
        rel_dir = os.path.relpath(root, static_dir)
        for filename in filenames:
            path = os.path.join(rel_dir, filename)
            if rel_dir == '.':
                path = filename
            size = os.path.getsize(os.path.join(root, filename))
            files.append({"path": path, "size": size})

    return jsonify({
        "static_folder": static_dir,
        "file_count": len(files),
        "files": files
    })
