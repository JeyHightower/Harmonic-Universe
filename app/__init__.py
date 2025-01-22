from flask import Flask
from config import Config
from .extensions import (
    db, migrate, jwt, cors, limiter,
    socketio, init_extensions
)
from .utils.error_handlers import register_error_handlers

def create_app(config_class=Config):
    """Create Flask application."""
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Initialize extensions
    init_extensions(app)

    # Register blueprints
    from .routes import register_routes
    register_routes(app)

    # Register error handlers
    register_error_handlers(app)

    # Initialize WebSocket service
    from .websocket import WebSocketService
    websocket_service = WebSocketService(socketio)
    websocket_service.register_handlers()

    with app.app_context():
        db.create_all()

    @app.route('/api/health')
    def health_check():
        from datetime import datetime
        return {"status": "healthy", "timestamp": datetime.now().isoformat()}

    return app
