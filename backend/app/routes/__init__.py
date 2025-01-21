"""Routes initialization."""
from flask import Blueprint
from .auth import auth_bp
from .universe import universe_bp
from .visualization import visualization_bp

def register_routes(app):
    """Register all blueprints with the app."""
    app.register_blueprint(auth_bp)
    app.register_blueprint(universe_bp)
    app.register_blueprint(visualization_bp)
