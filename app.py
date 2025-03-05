"""
Root-level app.py to fix import issues on Render.com
This file provides a clean entry point for gunicorn
"""
import os
import sys
import glob
import logging

# Add the current directory to Python path to ensure imports work correctly
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_app():
    """
    Factory function that creates and returns the Flask application.
    This avoids circular imports by importing the actual app inside the function.
    """
    try:
        # Import your actual application from the backend
        from backend.app import create_app as backend_create_app
        # Import the appropriate config from backend
        from backend.app.core.config import config
        from flask import Flask, send_from_directory, current_app

        # Create the application using the backend factory function
        app = backend_create_app(config['production'])

        # Add error logging middleware
        def log_request_errors():
            """Middleware to log request details when errors occur"""
            def middleware(environ, start_response):
                path = environ.get('PATH_INFO', '')

                # Define a custom start_response to catch errors
                def custom_start_response(status, headers, exc_info=None):
                    # Log error details for 500 responses
                    if status.startswith('500'):
                        logger.error(f"500 Error on path: {path}")
                        logger.error(f"Request method: {environ.get('REQUEST_METHOD')}")
                        if exc_info:
                            logger.error(f"Exception: {exc_info[1]}")
                            logger.error(''.join(traceback.format_exception(*exc_info)))
                    return start_response(status, headers, exc_info)

                # Return the WSGI app with our custom start_response
                return app.wsgi_app(environ, custom_start_response)

            return middleware

        # Register the error logging middleware
        app.wsgi_app = log_request_errors()(app.wsgi_app)

        # Add a specific route handler for ant-icons fallback
        @app.route('/assets/ant-icons-<path:filename>.js')
        def serve_ant_icons_fallback(filename):
            """Serve fallback if the requested ant-icons file doesn't exist"""
            # First try to find the actual file
            asset_path = os.path.join(app.static_folder, 'assets')
            requested_file = f'ant-icons-{filename}.js'

            if os.path.exists(os.path.join(asset_path, requested_file)):
                return send_from_directory(asset_path, requested_file)

            # If not found, serve the fallback (if it exists)
            fallback_path = os.path.join(asset_path, 'ant-icons-fallback.js')
            if os.path.exists(fallback_path):
                app.logger.warning(f"Ant icons file {requested_file} not found, serving fallback")
                return send_from_directory(asset_path, 'ant-icons-fallback.js')
            else:
                app.logger.error(f"Neither requested ant-icons file nor fallback exists")
                return f"Ant icons file not found: {requested_file}", 404

        # Add a debug endpoint to check static files
        @app.route('/check-static-files')
        def check_static_files():
            """Debug endpoint to check if static files exist"""
            static_path = app.static_folder
            result = {
                'static_folder': static_path,
                'static_url_path': app.static_url_path,
                'files': {},
            }

            # Check for ant-icons files
            ant_icons_files = glob.glob(os.path.join(static_path, 'assets', 'ant-icons-*.js'))
            result['files']['ant_icons'] = [os.path.basename(f) for f in ant_icons_files]

            # Check for index.html
            index_path = os.path.join(static_path, 'index.html')
            result['files']['index_html'] = os.path.exists(index_path)

            # Check assets directory
            assets_path = os.path.join(static_path, 'assets')
            result['files']['assets_dir'] = os.path.exists(assets_path)
            if os.path.exists(assets_path):
                result['files']['assets_files'] = os.listdir(assets_path)

            return result

        # Make sure all routes are handled, even if not explicitly defined
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def serve_react_app(path):
            if path and os.path.exists(os.path.join(app.static_folder, path)):
                return send_from_directory(app.static_folder, path)
            return send_from_directory(app.static_folder, 'index.html')

        return app
    except Exception as e:
        import traceback
        print(f"Error creating app: {e}")
        print(traceback.format_exc())
        raise

# Optional: Allow direct execution of this file
if __name__ == "__main__":
    app = create_app()
    app.run(host="0.0.0.0", port=int(os.environ.get("PORT", 8000)))
