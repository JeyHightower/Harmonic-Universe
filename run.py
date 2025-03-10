#!/usr/bin/env python
"""
Run the application with automatic port selection.
This script checks if the default port is in use and finds an available port automatically.
"""
import os
import sys
import logging
import socket
from flask import Flask

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger("run")

# Add the current directory to the Python path if not already there
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

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
    """Import the application module."""
    try:
        # First try to import from app package
        try:
            from app import create_app
            logger.info("Successfully imported application from app package")
            return create_app()
        except (ImportError, AttributeError) as e:
            logger.warning(f"Could not import from app package: {e}")

            # Try importing from backend.app
            try:
                from backend.app import create_app
                logger.info("Successfully imported application from backend.app package")
                return create_app()
            except ImportError as e:
                logger.warning(f"Could not import from backend.app package: {e}")

                # As a last resort, look for app as a global variable
                try:
                    from app import app
                    logger.info("Successfully imported app instance from app package")
                    return app
                except ImportError as e:
                    logger.error(f"Could not import app: {e}")
                    raise ImportError("Could not import application. Make sure your import paths are correct.")
    except Exception as e:
        logger.error(f"Error importing application: {e}")
        raise

def run_app(app, port):
    """Run the Flask application."""
    try:
        logger.info(f"Starting application on port {port}")
        app.run(host='0.0.0.0', port=port, debug=True)
    except Exception as e:
        logger.error(f"Error running application: {e}")
        raise

if __name__ == '__main__':
    try:
        # Get default port from environment or use 10000
        default_port = int(os.environ.get('PORT', 10000))

        # Find available port
        port = find_available_port(default_port)
        if not port:
            sys.exit(1)

        # Import application
        app = import_application()

        # Run the application
        run_app(app, port)
    except Exception as e:
        logger.error(f"Failed to start application: {e}")
        sys.exit(1)
