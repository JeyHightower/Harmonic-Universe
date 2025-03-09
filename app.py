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

# Setup logging to stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

# Enable CORS for all routes
@app.after_request
def add_cors_headers(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,POST,OPTIONS')
    return response

# Standard health response for all endpoints
def get_health_response():
    return jsonify({
        "status": "healthy",
        "message": "Health check passed",
        "ok": True,
        "version": "1.0.0"
    })

# Support both status formats for backward compatibility
@app.route('/health')
def health():
    """Health check endpoint"""
    logger.info("Health check endpoint called")
    return get_health_response()

@app.route('/api/health')
def api_health():
    """API Health check endpoint"""
    logger.info("API Health check endpoint called")
    return get_health_response()

@app.route('/ping')
@app.route('/status')
@app.route('/healthcheck')
def alternate_health():
    """Alternative health check endpoints for legacy tests"""
    logger.info("Alternative health check endpoint called")
    return get_health_response()

@app.route('/api/ping')
@app.route('/api/status')
@app.route('/api/healthcheck')
def api_alternate_health():
    """API alternative health check endpoints"""
    logger.info("API alternative health check endpoint called")
    return get_health_response()

# Direct demo login endpoint
@app.route('/api/auth/demo-login', methods=['POST', 'OPTIONS'])
def direct_demo_login():
    """Direct demo login endpoint for the static HTML page"""
    if request.method == 'OPTIONS':
        logger.info("OPTIONS request to demo login endpoint")
        response = jsonify({})
        response.headers.add('Access-Control-Allow-Methods', 'POST, OPTIONS')
        response.headers.add('Access-Control-Allow-Headers', 'Content-Type')
        return response, 204

    logger.info("Direct demo login endpoint called with POST")

    try:
        # Create a simple demo token
        logger.info("Creating demo token")

        # Use a simple string as the secret key
        secret_key = "demo_secret_key_for_testing_only"

        payload = {
            'user_id': 'demo123',
            'username': 'demo_user',
            'email': 'demo@example.com',
            'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=24)
        }

        logger.info(f"Token payload: {payload}")

        try:
            token = jwt.encode(payload, secret_key, algorithm='HS256')
            logger.info("Token created successfully")
        except Exception as jwt_error:
            logger.error(f"JWT encoding error: {jwt_error}")
            raise

        # Convert bytes to string if needed
        if isinstance(token, bytes):
            token = token.decode('utf-8')
            logger.info("Converted token from bytes to string")

        logger.info("Demo login successful")

        response_data = {
            'message': 'Demo login successful',
            'token': token,
            'access_token': token,
            'refresh_token': token,
            'user': {
                'id': 'demo123',
                'username': 'demo_user',
                'email': 'demo@example.com'
            }
        }

        logger.info(f"Returning response: {response_data}")
        return jsonify(response_data)
    except Exception as e:
        logger.error(f"Error in direct demo login: {str(e)}", exc_info=True)
        return jsonify({'message': 'An error occurred during demo login', 'error': str(e)}), 500

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the configured directory"""
    # Try multiple static directories - first check environment variable,
    # then Render path, then local directory
    static_paths = [
        os.environ.get('STATIC_DIR'),
        '/opt/render/project/src/static',
        os.path.join(os.getcwd(), 'static')
    ]

    # Use first existing directory
    static_dir = next((p for p in static_paths if p and os.path.exists(p)), 'static')

    logger.info(f"Serving {path} from {static_dir}")
    return send_from_directory(static_dir, path)

# Create and expose the Flask application
application = create_app()
app = application  # Alias for compatibility

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)
