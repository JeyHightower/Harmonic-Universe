"""
Application factory.
"""

from flask import Flask
from app.config import settings
from app.extensions import init_extensions
from app.routes import init_routes

def create_app(info=None):
    """Create Flask application."""
    app = Flask(__name__)

    # Configure app
    app.config.from_object(settings)

    # Initialize extensions
    init_extensions(app)

    # Register routes
    init_routes(app)

    return app
