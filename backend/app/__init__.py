from flask import Flask
from flask_cors import CORS
from .extensions import db, migrate, jwt, limiter, socketio
from .config import Config
from .routes.auth_routes import auth_bp
from .routes.universe_routes import universe_bp
from .routes.comment_routes import comment_bp
from .routes.favorite_routes import favorite_bp
from .routes.storyboard_routes import storyboard_bp
from .routes.audio_routes import audio_bp
from .routes.visualization_routes import visualization_bp
from .websocket.service import WebSocketService

def init_websocket(app):
    websocket_service = WebSocketService(app)
    return websocket_service

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    CORS(app)
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    limiter.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    # Initialize WebSocket
    websocket_service = init_websocket(app)

    # Register blueprints
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(universe_bp, url_prefix='/api/universes')
    app.register_blueprint(comment_bp, url_prefix='/api/comments')
    app.register_blueprint(favorite_bp, url_prefix='/api/favorites')
    app.register_blueprint(storyboard_bp, url_prefix='/api/storyboards')
    app.register_blueprint(audio_bp, url_prefix='/api/audio')
    app.register_blueprint(visualization_bp, url_prefix='/api/visualization')

    @app.errorhandler(404)
    def not_found_error(error):
        return {'error': 'Not Found'}, 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return {'error': 'Internal Server Error'}, 500

    return app
