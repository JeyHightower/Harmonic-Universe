from flask import Flask, send_from_directory
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)

@app.route('/health')
def health_check():
    """Health check endpoint that returns 200 OK"""
    logger.info("Health check endpoint called")
    return {'status': 'ok'}, 200

@app.route('/', defaults={'path': 'index.html'})
@app.route('/<path:path>')
def serve_static(path):
    """Serve static files from the static directory"""
    static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
    logger.info(f"Serving static file: {path} from {static_dir}")
    return send_from_directory(static_dir, path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=10000)
