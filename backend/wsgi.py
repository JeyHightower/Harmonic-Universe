"""
WSGI entry point for gunicorn
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("wsgi")
logger.info("Initializing WSGI application")

# Add the project root and backend directories to the Python path
current_dir = os.path.abspath(os.path.dirname(__file__))
project_root = os.path.abspath(os.path.join(current_dir, '..'))
sys.path.insert(0, current_dir)
sys.path.insert(0, project_root)
logger.info(f"Added to Python path: {current_dir}, {project_root}")
logger.info(f"Full Python path: {sys.path}")

# Now import the app module
try:
    from backend.app import create_app
    logger.info("Successfully imported app modules from backend.app")
except ImportError as e:
    logger.error(f"Import error: {e}")
    # Try alternative import paths
    try:
        from app import create_app
        logger.info("Successfully imported from app")
    except ImportError as e2:
        logger.error(f"Alternative import also failed: {e2}")
        raise

# Create the Flask application
application = create_app()
app = application  # For compatibility with different WSGI servers
logger.info("Flask application created successfully")

if __name__ == "__main__":
    # For direct execution
    port = int(os.environ.get('PORT', 10000))
    logger.info(f"Starting development server on port {port}")
    app.run(host='0.0.0.0', port=port)
