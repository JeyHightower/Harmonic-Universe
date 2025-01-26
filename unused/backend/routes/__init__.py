from flask import Blueprint
from .auth_routes import auth_bp
from .universe_routes import universe_bp

def init_routes(app):
    """Initialize all route blueprints"""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universe')
