#!/usr/bin/env python
"""
Backend application runner with automatic port selection
"""
import os
import sys
import logging
import socket

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("backend_run")

# Add parent directory to Python path to ensure imports work correctly
parent_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
if parent_dir not in sys.path:
    sys.path.insert(0, parent_dir)

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

logger.info(f"Python path: {sys.path}")

def is_port_in_use(port):
    """Check if a port is in use."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def find_available_port(start_port, max_attempts=10):
    """Find an available port starting from start_port."""
    port = start_port
    attempts = 0

    while attempts < max_attempts:
        if not is_port_in_use(port):
            logger.info(f"Using port: {port}")
            return port

        logger.warning(f"Port {port} is in use, trying next port")
        port += 1
        attempts += 1

    logger.error(f"Could not find an available port after {max_attempts} attempts")
    return None

def import_application():
    """Import the application."""
    try:
        # First try to import from app module in current directory
        try:
            from app import create_app
            logger.info("Successfully imported create_app from app module")
            return create_app()
        except (ImportError, AttributeError) as e:
            logger.warning(f"Could not import create_app from app module: {e}")

            # Try importing from app as an app instance
            try:
                from app import app
                logger.info("Successfully imported app instance from app module")
                return app
            except (ImportError, AttributeError) as e:
                logger.warning(f"Could not import app instance from app module: {e}")

                # Try the module itself
                try:
                    import app
                    if hasattr(app, 'create_app'):
                        logger.info("Successfully imported create_app from app package")
                        return app.create_app()
                    elif hasattr(app, 'app'):
                        logger.info("Successfully imported app instance from app package")
                        return app.app
                    else:
                        logger.error("app module found but no create_app function or app instance")
                except ImportError as e:
                    logger.error(f"Could not import app module: {e}")
                    raise ImportError("Could not import application. Make sure your import paths are correct.")
    except Exception as e:
        logger.error(f"Error importing application: {e}")
        raise

def run_app(app, port):
    """Run the Flask application."""
    try:
        logger.info(f"Starting backend application on port {port}")
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        logger.error(f"Error running application: {e}")
        raise

if __name__ == '__main__':
    try:
        # Get default port from environment or use 5000
        default_port = int(os.environ.get('BACKEND_PORT', 5000))

        # Find available port
        port = find_available_port(default_port)
        if not port:
            sys.exit(1)

        # Import application
        app = import_application()

        # Run the application
        run_app(app, port)
    except Exception as e:
        logger.error(f"Failed to start backend application: {e}")
        sys.exit(1)
