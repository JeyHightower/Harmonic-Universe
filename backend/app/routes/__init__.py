"""
Routes initialization.
"""

from flask import Blueprint

def init_routes(app):
    """Initialize routes."""
    # Create blueprints
    api_bp = Blueprint('api', __name__, url_prefix='/api/v1')

    # Import routes
    from app.routes.auth import auth_bp
    from app.routes.users import users_bp
    from app.routes.universes import universes_bp
    from app.routes.scenes import scenes_bp
    from app.routes.visualization import visualization_bp
    from app.routes.physics import physics_bp
    from app.routes.music import music_bp
    from app.routes.storyboards import storyboards_bp

    # Register blueprints
    api_bp.register_blueprint(auth_bp)
    api_bp.register_blueprint(users_bp)
    api_bp.register_blueprint(universes_bp)
    api_bp.register_blueprint(scenes_bp)
    api_bp.register_blueprint(visualization_bp)
    api_bp.register_blueprint(physics_bp)
    api_bp.register_blueprint(music_bp)
    api_bp.register_blueprint(storyboards_bp)

    # Register main blueprint
    app.register_blueprint(api_bp)
