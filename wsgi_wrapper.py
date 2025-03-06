#!/usr/bin/env python
# wsgi_wrapper.py - A wrapper that ensures dependencies are available

import os
import sys
import logging

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("wsgi_wrapper")

logger.info("Starting wsgi_wrapper.py")
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path before modification: {sys.path}")

# Add current directory to Python path if not already there
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Add other potential directories
render_path = "/opt/render/project/src"
if os.path.exists(render_path) and render_path not in sys.path:
    sys.path.insert(0, render_path)
    logger.info(f"Added {render_path} to Python path")

logger.info(f"Python path after modification: {sys.path}")

# Verify critical dependencies
try:
    import flask
    logger.info(f"Successfully imported Flask {flask.__version__}")
except ImportError:
    logger.error("Failed to import Flask. Attempting to install it.")
    try:
        import subprocess
        logger.info("Installing Flask with pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "Flask==2.0.1"])
        import flask
        logger.info(f"Successfully installed and imported Flask {flask.__version__}")
    except Exception as e:
        logger.error(f"Failed to install Flask: {e}")

try:
    import psycopg2
    logger.info(f"Successfully imported psycopg2 {psycopg2.__version__}")
except ImportError:
    logger.error("Failed to import psycopg2. Attempting to install it.")
    try:
        import subprocess
        logger.info("Installing psycopg2-binary with pip...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "psycopg2-binary==2.9.9"])
        import psycopg2
        logger.info(f"Successfully installed and imported psycopg2 {psycopg2.__version__}")
    except Exception as e:
        logger.error(f"Failed to install psycopg2: {e}")

# Attempt to import the app
try:
    from wsgi import app as application
    logger.info("Successfully imported app from wsgi.py")
except Exception as e:
    logger.error(f"Error importing from wsgi.py: {e}")
    try:
        from wsgi_app import application
        logger.info("Successfully imported application from wsgi_app.py")
    except Exception as e:
        logger.error(f"Error importing from wsgi_app.py: {e}")
        try:
            from app import create_app
            application = create_app()
            logger.info("Created application using create_app()")
        except Exception as e:
            logger.error(f"Error creating application with create_app(): {e}")
            # Create a minimal fallback application
            try:
                from flask import Flask, jsonify
                application = Flask(__name__)

                @application.route('/')
                def health_check():
                    return jsonify({"status": "error", "message": "Application failed to load"})

                logger.warning("Created fallback Flask application")
            except Exception as e:
                logger.critical(f"Failed to create even a fallback application: {e}")
                raise RuntimeError("Could not create any Flask application")

# This is the WSGI entry point that gunicorn will use
app = application
