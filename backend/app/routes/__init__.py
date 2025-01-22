"""Routes initialization."""
from flask import Blueprint

# Import all route blueprints
from .auth_routes import auth_bp
from .universe_routes import universe_bp
from .visualization_routes import visualization_bp
from .audio_routes import audio_bp
from .analytics_routes import analytics_bp
from .storyboard_routes import storyboard_bp
from .favorite_routes import favorite_bp
from .comment_routes import comment_bp
from .user_routes import user_bp
from .notifications import notifications_bp
from .preferences import preferences_bp

def register_routes(app):
    """Register all blueprints/routes with the app."""
    app.register_blueprint(auth_bp)  # auth_bp already has url_prefix='/api/auth'
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualization')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(analytics_bp, url_prefix='/api/analytics')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(favorite_bp, url_prefix='/api/favorites')
    app.register_blueprint(comment_bp, url_prefix='/api/comments')
    app.register_blueprint(user_bp, url_prefix='/api/users')
    app.register_blueprint(notifications_bp, url_prefix='/api/notifications')
    app.register_blueprint(preferences_bp, url_prefix='/api/preferences')

# Import models to ensure they are registered with SQLAlchemy
from ..models import *  # noqa
