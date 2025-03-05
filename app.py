"""
Root-level app.py to fix import issues on Render.com
This file provides a clean entry point for gunicorn
"""
import os
import sys
import glob
import logging
from flask import Flask, send_from_directory, current_app

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
        # Import the middleware
        from backend.middleware import log_request_errors

        app = Flask(__name__,
                    static_folder='static',
                    static_url_path='')

        # Enable debugging on Render
        app.config['DEBUG'] = True

        # Log the static folder path at startup
        logger.info(f"Static folder path: {os.path.abspath(app.static_folder)}")
        logger.info(f"Static folder contents: {os.listdir(app.static_folder) if os.path.exists(app.static_folder) else 'Not found'}")

        # Register the error logging middleware correctly
        app.wsgi_app = log_request_errors(app.wsgi_app)

        # Special route for ant-icons files with error handling
        @app.route('/assets/ant-icons<path:filename>')
        def serve_ant_icons(filename):
            logger.info(f"Requested ant-icons file: {filename}")

            try:
                # Check if the exact file exists
                assets_path = os.path.join(app.static_folder, 'assets')
                if not os.path.exists(assets_path):
                    logger.warning(f"Assets directory not found at {assets_path}")
                    return "Assets directory not found", 404

                # Log the assets directory contents
                logger.info(f"Assets directory contents: {os.listdir(assets_path)}")

                full_filename = f"ant-icons{filename}"
                file_path = os.path.join(assets_path, full_filename)

                # If the file exists, serve it
                if os.path.exists(file_path):
                    logger.info(f"Serving existing file: {file_path}")
                    return send_from_directory(assets_path, full_filename)

                # If the hashed version doesn't exist, look for any ant-icons file
                ant_files = [f for f in os.listdir(assets_path) if f.startswith('ant-icons') and f.endswith('.js')]
                if ant_files:
                    logger.info(f"Serving fallback ant-icons file: {ant_files[0]}")
                    return send_from_directory(assets_path, ant_files[0])

                # If no ant-icons files found, serve an empty mock
                logger.warning("No ant-icons files found, serving mock file")
                return """
                console.log("Using ant-icons mock file");
                var IconContext = {Provider: function() {}, Consumer: function() {}};
                window.IconContext = IconContext;
                window.__ANT_ICONS__ = {};
                """, 200, {'Content-Type': 'application/javascript'}

            except Exception as e:
                logger.error(f"Error serving ant-icons file: {str(e)}")
                # Return a working JavaScript file instead of an error
                return """
                console.error("Error loading ant-icons, using fallback");
                var IconContext = {Provider: function(props) { return props.children; }, Consumer: function() {}};
                window.IconContext = IconContext;
                window.__ANT_ICONS__ = {};
                """, 200, {'Content-Type': 'application/javascript'}

        # General static file handler - CHANGED ENDPOINT NAME TO AVOID CONFLICT
        @app.route('/assets/<path:filename>', endpoint='serve_general_assets')
        def serve_general_assets(filename):
            try:
                assets_dir = os.path.join(app.static_folder, 'assets')
                logger.info(f"Serving asset: {filename} from {assets_dir}")
                return send_from_directory(assets_dir, filename)
            except Exception as e:
                logger.error(f"Error serving asset {filename}: {str(e)}")
                return f"Error serving asset: {str(e)}", 500

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

        # Catch-all route to return index.html for client-side routing
        @app.route('/', defaults={'path': ''})
        @app.route('/<path:path>')
        def catch_all(path):
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
