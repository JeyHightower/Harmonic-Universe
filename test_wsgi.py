#!/usr/bin/env python
"""
Test script to verify WSGI configuration.
Run this to check if your Flask application loads correctly.
"""
import logging
import os
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s'
)
logger = logging.getLogger("test_wsgi")

def test_wsgi_setup():
    """Test loading the Flask application from wsgi.py."""
    logger.info("Testing WSGI configuration")

    try:
        logger.info("Importing app from wsgi.py")
        import wsgi

        # Check if app is properly exposed
        if not hasattr(wsgi, 'app'):
            logger.error("Error: wsgi.py does not expose 'app' variable")
            return False

        # Check if it's a Flask application
        from flask import Flask
        if not isinstance(wsgi.app, Flask):
            logger.error(f"Error: wsgi.app is not a Flask application, it's a {type(wsgi.app)}")
            return False

        # Test app properties
        logger.info(f"App name: {wsgi.app.name}")
        logger.info(f"Static folder: {wsgi.app.static_folder}")
        logger.info(f"Routes: {[rule.rule for rule in wsgi.app.url_map.iter_rules()]}")

        # Verify static folder exists
        if not os.path.exists(wsgi.app.static_folder):
            logger.warning(f"Warning: Static folder {wsgi.app.static_folder} does not exist")
        else:
            logger.info(f"Static folder {wsgi.app.static_folder} exists")

            # Check for index.html
            index_path = os.path.join(wsgi.app.static_folder, 'index.html')
            if os.path.exists(index_path):
                logger.info(f"index.html exists ({os.path.getsize(index_path)} bytes)")
            else:
                logger.warning("index.html does not exist in static folder")

        return True
    except ImportError as e:
        logger.error(f"Error importing wsgi module: {e}")
        return False
    except Exception as e:
        logger.error(f"Unexpected error in WSGI test: {e}")
        return False

if __name__ == "__main__":
    success = test_wsgi_setup()
    if success:
        logger.info("WSGI configuration looks good!")
        sys.exit(0)
    else:
        logger.error("WSGI configuration test failed!")
        sys.exit(1)
