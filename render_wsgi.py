#!/usr/bin/env python
# Simple WSGI entry point for Render.com deployment

import os
import sys
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_wsgi")

# Set up paths
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Import the app from the app package
try:
    logger.info("Importing Flask app using create_app factory")
    from app import create_app
    app = create_app()
    logger.info("Successfully created Flask application")

    # Add middleware to ensure Content-Length header is set
    @app.after_request
    def ensure_content_length(response):
        """Ensure Content-Length header is set for all responses."""
        if 'Content-Length' not in response.headers and hasattr(response, 'data'):
            response.headers['Content-Length'] = str(len(response.data))
        return response

    # Add a test route
    @app.route('/render-test')
    def render_test():
        """Test route to verify WSGI setup."""
        return {
            'status': 'ok',
            'message': 'Render WSGI test successful',
            'static_folder': app.static_folder,
            'routes': [str(rule) for rule in app.url_map.iter_rules()]
        }

except Exception as e:
    logger.error(f"Failed to create Flask app: {e}", exc_info=True)
    raise

# For direct execution (useful for local testing)
if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8000))
    logger.info(f"Starting Flask app on port {port}")
    app.run(host='0.0.0.0', port=port)
