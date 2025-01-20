from flask import Flask
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from .extensions import db, limiter, ratelimit_error_handler
from .routes.auth_routes import auth_bp
from .routes.universe_routes import universe_bp
from .routes.storyboard_routes import storyboard_bp
from .routes.comment_routes import comment_bp
from .routes.favorite_routes import favorite_bp
from .routes.audio_routes import audio_bp
from .routes.visualization_routes import visualization_bp
from .websocket.manager import WebSocketManager

def init_websocket(app):
    """Initialize WebSocket after app creation to avoid circular imports."""
    websocket_manager = WebSocketManager(app)
    app.websocket_manager = websocket_manager

def create_app(config_name='development'):
    """Create Flask application."""
    app = Flask(__name__)

    # Load config based on environment
    if config_name == 'production':
        app.config.from_object('config.ProductionConfig')
    elif config_name == 'testing':
        app.config.from_object('config.TestingConfig')
    else:
        app.config.from_object('config.DevelopmentConfig')

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    jwt = JWTManager(app)
    limiter.init_app(app)
    app.errorhandler(429)(ratelimit_error_handler)

    # Register blueprints with URL prefixes
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(comment_bp, url_prefix='/api/comments')
    app.register_blueprint(favorite_bp, url_prefix='/api/favorites')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualization')

    # Initialize WebSocket manager
    init_websocket(app)

    # Create database tables
    with app.app_context():
        db.create_all()

    # Error handlers
    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal server error'}, 500

    return app
