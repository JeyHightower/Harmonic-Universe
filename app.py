from flask import Flask, send_from_directory, jsonify
import os
import logging
import sys

# Setup logging to stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

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
    """API versions of alternative health check endpoints"""
    logger.info("API alternative health check endpoint called")
    return get_health_response()

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

# For legacy imports and integrations
def create_app():
    """Factory function for app creation (for legacy compatibility)"""
    return app

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 10000))
    app.run(host='0.0.0.0', port=port, debug=True)
