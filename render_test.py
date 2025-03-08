#!/usr/bin/env python
"""
Test script for Render.com deployment.
"""
import sys
import os
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("render_test")

def test_render_deployment():
    """Test the Render.com deployment configuration."""
    logger.info("Testing Render.com deployment")

    # Test importing the WSGI app
    try:
        logger.info("Importing render_wsgi")
        import render_wsgi

        if not hasattr(render_wsgi, 'app'):
            logger.error("render_wsgi does not have 'app' attribute")
            return False

        logger.info(f"WSGI app type: {type(render_wsgi.app)}")
        logger.info(f"WSGI app static folder: {render_wsgi.app.static_folder}")
        logger.info(f"WSGI app routes: {[rule.rule for rule in render_wsgi.app.url_map.iter_rules()]}")

        # Check if the static folder exists
        if not os.path.exists(render_wsgi.app.static_folder):
            logger.warning(f"Static folder {render_wsgi.app.static_folder} does not exist")
        else:
            logger.info(f"Static folder {render_wsgi.app.static_folder} exists")

            # Check for index.html
            index_path = os.path.join(render_wsgi.app.static_folder, 'index.html')
            if os.path.exists(index_path):
                logger.info(f"index.html exists: {index_path}")
            else:
                logger.warning(f"index.html not found at {index_path}")

        return True
    except ImportError:
        logger.error("Failed to import render_wsgi")
        return False
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        return False

if __name__ == "__main__":
    # Run the test
    logger.info("Starting Render.com deployment test")
    if test_render_deployment():
        logger.info("Render.com deployment test passed")
        sys.exit(0)
    else:
        logger.error("Render.com deployment test failed")
        sys.exit(1)
