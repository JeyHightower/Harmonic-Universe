"""
Development runner module for the Harmonic Universe backend.

This module is intended for local development only.
For production deployment, use wsgi.py instead.

This module imports and creates the Flask application,
making it easier to run the application locally.
"""

import os
import sys
import logging

# Add the backend directory to the path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

# Set up logging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create a simple Flask application
from flask import Flask
from backend.app.extensions import db
from backend.app.config import config
from backend.app.api.routes import api_bp

def create_app(config_name='development'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])
    
    # Initialize extensions
    db.init_app(app)
    
    # Register blueprints
    app.register_blueprint(api_bp, url_prefix='/api')
    
    @app.route('/health')
    def health_check():
        return {"status": "healthy"}, 200
    
    return app

# Create the Flask application
app = create_app()

if __name__ == "__main__":
    port = int(os.environ.get('PORT', 5001))
    print(f"Starting development server on port {port}")
    print("NOTE: For production, use wsgi.py instead")
    app.run(host='0.0.0.0', port=port, debug=True) 