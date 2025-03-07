#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
import traceback
from port import get_port

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("wsgi")

logger.info("Loading application in wsgi.py")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Log environment information
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")
logger.info(f"Virtual env: {os.environ.get('VIRTUAL_ENV', 'Not found')}")

# Verify virtual environment is active
if not os.environ.get('VIRTUAL_ENV'):
    logger.warning("Virtual environment not detected!")

# Import dependencies to verify they're installed
try:
    import flask
    import sqlalchemy
    import flask_sqlalchemy
    from flask_migrate import Migrate
    logger.info(f"Found Flask: {flask.__version__}")
    logger.info(f"Found SQLAlchemy: {sqlalchemy.__version__}")
    logger.info(f"Found Flask-SQLAlchemy: {flask_sqlalchemy.__version__}")
    logger.info("Successfully imported Flask-Migrate")
except ImportError as e:
    logger.error(f"Failed to import required dependencies: {e}")
    raise  # Fail fast if dependencies are missing
except Exception as e:
    logger.error(f"Error verifying dependencies: {e}")
    raise

# Ensure static directory exists
static_dir = os.environ.get('STATIC_DIR', '/opt/render/project/src/static')
try:
    os.makedirs(static_dir, exist_ok=True)
    os.chmod(static_dir, 0o755)
    logger.info(f"Ensured static directory exists: {static_dir}")
except Exception as e:
    logger.error(f"Error setting up static directory: {e}")
    raise

# Import and create the Flask application
try:
    from app import create_app
    app = create_app()
    logger.info("Successfully created Flask application")

    # Verify application configuration
    logger.info(f"App static folder: {app.static_folder}")
    logger.info(f"App static url path: {app.static_url_path}")
    logger.info(f"Static folder exists: {os.path.exists(app.static_folder)}")
    logger.info(f"Static folder contents: {os.listdir(app.static_folder)}")

    # Add health check endpoint directly in wsgi for redundancy
    @app.route('/health')
    def wsgi_health_check():
        try:
            static_exists = os.path.exists(app.static_folder)
            index_exists = os.path.exists(os.path.join(app.static_folder, 'index.html'))
            return {
                'status': 'healthy',
                'static_folder': static_exists,
                'index_html': index_exists,
                'python_path': sys.path,
                'virtual_env': os.environ.get('VIRTUAL_ENV', 'Not found')
            }
        except Exception as e:
            logger.error(f"Health check failed: {e}")
            return {'status': 'unhealthy', 'error': str(e)}, 500

except Exception as e:
    logger.error(f"Failed to create Flask application: {e}")
    logger.error(traceback.format_exc())
    raise

if __name__ == "__main__":
    # Run the application in development
    port = get_port()
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
