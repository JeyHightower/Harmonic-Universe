#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
import traceback
from port import get_port

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("wsgi")

logger.info("Loading application in wsgi.py")

# Add current directory to Python path
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.append(current_dir)
    logger.info(f"Added {current_dir} to Python path")

# Log environment information
logger.info(f"Current directory: {os.getcwd()}")
logger.info(f"Python path: {sys.path}")

# Try to import psycopg2 and log version info for debugging
try:
    import psycopg2
    logger.info(f"Using psycopg2 version: {psycopg2.__version__}")
except ImportError:
    logger.error("Failed to import psycopg2. Check if it's installed correctly.")
except Exception as e:
    logger.error(f"Error importing psycopg2: {str(e)}")

# Ensure static directory exists and has index.html before importing app
# This helps avoid issues with Flask looking for static files on startup
render_static = '/opt/render/project/src/static'
if not os.path.exists(render_static):
    try:
        os.makedirs(render_static, exist_ok=True)
        logger.info(f"Created Render static directory: {render_static}")
    except Exception as e:
        logger.error(f"Failed to create Render static directory: {e}")

# Check for index.html and create it if needed
render_index = os.path.join(render_static, 'index.html')
if not os.path.exists(render_index):
    try:
        with open(render_index, 'w') as f:
            f.write("""<!DOCTYPE html>
<html>
<head>
    <title>Harmonic Universe</title>
    <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
        h1 { color: #333; }
    </style>
</head>
<body>
    <h1>Harmonic Universe</h1>
    <p>Welcome to the Harmonic Universe application!</p>
    <p>Created by wsgi.py on startup.</p>
</body>
</html>""")
        logger.info(f"Created index.html at {render_index}")
    except Exception as e:
        logger.error(f"Failed to create index.html: {e}")

# Import dependencies to verify they're installed
try:
    logger.info(f"Found Flask: {__import__('flask').__version__}")
    logger.info(f"Found SQLAlchemy: {__import__('sqlalchemy').__version__}")
    from flask_migrate import Migrate
    logger.info("Successfully imported Flask-Migrate")
except ImportError as e:
    logger.error(f"Failed to import required dependencies: {e}")
except Exception as e:
    logger.error(f"Error verifying dependencies: {e}")

# Import the app from your app.py file
from app import app

# No need to create app again as it's imported

if __name__ == "__main__":
    # Run the application in development
    port = get_port()
    logger.info(f"Starting development server on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
