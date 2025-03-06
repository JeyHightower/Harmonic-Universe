#!/usr/bin/env python
# Application factory pattern for gunicorn
import os
import sys
import logging
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

# Print directory and Python path information
print(f"Current directory: {os.getcwd()}")
print(f"Python path: {sys.path}")

# Import dependencies to verify they're installed
logger.info(f"Found Flask: {__import__('flask').__version__}")
logger.info(f"Found SQLAlchemy: {__import__('sqlalchemy').__version__}")

try:
    from flask_migrate import Migrate
    logger.info("Successfully imported Flask-Migrate")
except ImportError:
    logger.error("Failed to import Flask-Migrate. Installing now...")
    import subprocess
    subprocess.check_call(["pip", "install", "Flask-Migrate==3.1.0"])
    from flask_migrate import Migrate
    logger.info("Flask-Migrate installed and imported successfully")

# Create the application
try:
    from app import create_app
    app = create_app()
    logger.info("Application created successfully")
except Exception as e:
    logger.error(f"Error creating application: {e}")
    from flask import Flask, jsonify
    app = Flask(__name__)

    @app.route('/')
    def error():
        return jsonify({'status': 'error', 'message': 'Application failed to load correctly'})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    app.run(host="0.0.0.0", port=port)
