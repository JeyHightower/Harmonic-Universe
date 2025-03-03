"""Register all routes."""
from flask import Flask
from .auth import auth_bp
from .universe import universe_bp
from .music_generation import audio_bp, physics_bp, ai_bp
from .visualization import visualization_bp
from .physics_objects import physics_objects_bp
from .scenes import scenes_bp
from .users import users_bp
from .physics_parameters import physics_parameters_bp
from .physics_constraints import physics_constraints_bp
from .music_flask import music_bp
from .health import health_bp

def register_routes(app: Flask):
    """Register all blueprints."""
    app.register_blueprint(auth_bp, url_prefix='/api/v1/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/v1/universes')
    app.register_blueprint(audio_bp, url_prefix='/api/v1/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/v1/visualizations')
    app.register_blueprint(physics_bp, url_prefix='/api/v1/physics')
    app.register_blueprint(ai_bp, url_prefix='/api/v1/ai')
    app.register_blueprint(physics_objects_bp, url_prefix='/api/v1/physics-objects')
    app.register_blueprint(physics_constraints_bp, url_prefix='/api/v1/physics-constraints')
    app.register_blueprint(music_bp, url_prefix='/api/v1/music')
    app.register_blueprint(scenes_bp, url_prefix='/api/v1/scenes')
    app.register_blueprint(users_bp, url_prefix='/api/v1/users')
    app.register_blueprint(physics_parameters_bp, url_prefix='/api/v1/physics-parameters')
    app.register_blueprint(health_bp, url_prefix='/api/v1')
