"""Register all routes."""
from flask import Flask
from .auth import auth_bp
from .universe import universe_bp
from .music_generation import audio_bp, visualization_bp, physics_bp, ai_bp
from .physics_objects import physics_objects_bp
from .scenes import scenes_bp
from .users import users_bp
from .physics_parameters import physics_parameters_bp
from .music_flask import music_bp

def register_routes(app: Flask):
    """Register all blueprints."""
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualizations')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(ai_bp, url_prefix='/api/ai')
    app.register_blueprint(physics_objects_bp, url_prefix='/api/physics-objects')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(scenes_bp, url_prefix='/api/scenes')
    app.register_blueprint(users_bp, url_prefix='/api/users')
    app.register_blueprint(physics_parameters_bp, url_prefix='/api/physics-parameters')
