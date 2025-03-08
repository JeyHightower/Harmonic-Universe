from flask import Flask, send_from_directory
import os
import logging
import sys

# Setup logging to stdout
logging.basicConfig(level=logging.INFO, stream=sys.stdout,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health')
def health():
    """Health check endpoint"""
    logger.info("Health check endpoint called")
    return {"status": "healthy", "message": "Health check passed"}, 200

@app.route('/api/health')
def api_health():
    """API Health check endpoint"""
    logger.info("API Health check endpoint called")
    return {"status": "healthy", "message": "Health check passed"}, 200

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

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000, debug=True)
