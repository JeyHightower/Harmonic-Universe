"""Register all routes."""
from flask import Flask
from .auth import auth_bp
from .users import users_bp
from .universe import universe_bp
from .scenes import scenes_bp
from .health import health_bp
from .music_generation import audio_bp, physics_bp, ai_bp
from .visualization import visualization_bp
from .physics_objects import physics_objects_bp
from .physics_parameters import physics_parameters_bp
from .physics_constraints import physics_constraints_bp
from .music_flask import music_bp


def register_all_routes(app: Flask):
    """Register all API routes with the Flask app"""

    # Register core routes
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(users_bp)

    # Register CRUD feature routes
    app.register_blueprint(universe_bp)
    app.register_blueprint(scenes_bp)

    # Register other blueprints as needed
    app.register_blueprint(audio_bp, url_prefix="/api/v1/audio")
    app.register_blueprint(visualization_bp, url_prefix="/api/v1/visualizations")
    app.register_blueprint(physics_bp, url_prefix="/api/v1/physics")
    app.register_blueprint(ai_bp, url_prefix="/api/v1/ai")
    app.register_blueprint(physics_objects_bp, url_prefix="/api/v1/physics-objects")
    app.register_blueprint(
        physics_constraints_bp, url_prefix="/api/v1/physics-constraints"
    )
    app.register_blueprint(music_bp, url_prefix="/api/v1/music")
    app.register_blueprint(
        physics_parameters_bp, url_prefix="/api/v1/physics-parameters"
    )

    return app
