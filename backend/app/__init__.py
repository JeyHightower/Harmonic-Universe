from flask import Flask
from flask_cors import CORS
from flask_socketio import SocketIO
from .config import Config
from .database import init_db
from .extensions import socketio

def create_app(config_class=Config):
    """Create and configure the Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Initialize database
    init_db(app)

    # Register blueprints
    from .routes.auth_routes import auth_bp
    from .routes.universe_routes import universe_bp
    from .routes.music_routes import music_bp
    from .routes.physics_routes import physics_bp
    from .routes.visualization_routes import visualization_bp
    from .routes.storyboard_routes import storyboard_bp
    from .routes.template_routes import template_bp

    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(music_bp, url_prefix='/api/music')
    app.register_blueprint(physics_bp, url_prefix='/api/physics')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualization')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(template_bp, url_prefix='/api/templates')

    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not Found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal Server Error'}, 500

    return app
